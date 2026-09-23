#!/usr/bin/env bash
# Splat ETL worker — runs on the spot L4, survives preemption.
#
# Every stage writes its output to GCS and stamps a `.done` marker. On boot the
# worker re-reads its job spec, skips any stage whose marker already exists and
# resumes at the first missing one. A spot reclaim therefore costs at most the
# one stage that was in flight when the instance disappeared.
#
# Layout in GCS (all under $ETL_PREFIX):
#   jobs.json                 job spec (written by the driver)
#   work/<job>/raw.morton.ply stage 0  Z-order prepass   morton.done
#   work/<job>/raw.ply        staged input
#   work/<job>/core.ply       stage 1  clip       core.done
#   work/<job>/clustered.ply  stage 2  cluster    clustered.done
#   work/<job>/final.ply      stage 3  decimate   final.done
#   work/<job>/final.spz      stage 4  encode     spz.done
#   work/<job>/sog/           stage 4  encode     sog.done
#   work/<job>/job.done       whole job finished
set -uo pipefail

ETL_PREFIX="${ETL_PREFIX:-gs://meghdoot-artifacts/etl}"
JOB_DIR="/mnt/job"
LOG="$JOB_DIR/worker.log"
mkdir -p "$JOB_DIR"
exec > >(tee -a "$LOG") 2>&1

say() { echo "[$(date -u +%H:%M:%S)] $*"; }
gcs() { gcloud storage "$@" 2>/dev/null || gsutil "$@"; }

# --- preemption handling -------------------------------------------------
# Spot gives ~30 s of warning (SIGTERM). Nothing in-flight is worth rescuing:
# each stage is atomic (temp file -> GCS), so we just exit cleanly and let the
# next instance resume from the last .done marker.
trap 'say "SIGTERM received (spot reclaim) — exiting; next instance resumes from last .done"; exit 143' TERM INT

# --- toolchain -----------------------------------------------------------
install_toolchain() {
  # A stopped/started instance comes back with the NVIDIA Vulkan path gone
  # (vulkaninfo reports llvmpipe), so "is splat-transform installed" is NOT a
  # sufficient check — we verify the actual GPU device every boot and repair.
  if command -v splat-transform >/dev/null 2>&1 && vulkaninfo --summary 2>/dev/null | grep -qiE 'deviceName *= *(NVIDIA|.*L4)'; then
    say "toolchain + NVIDIA Vulkan OK"
    return 0
  fi
  say "toolchain missing or GPU not visible to Vulkan — repairing"
  if ! nvidia-smi -L >/dev/null 2>&1; then
    say "  nvidia-smi sees no GPU; loading kernel modules"
    sudo modprobe nvidia nvidia_uvm 2>/dev/null || true
    sleep 5
  fi
  say "installing toolchain (node, splat-transform, NVIDIA GL/Vulkan)"
  sudo apt-get update -qq
  # libnvidia-gl brings libGLX_nvidia.so.0 (the Vulkan entry points); the DLVM
  # image only ships the *compute* libs, which is why WebGPU cannot start.
  sudo apt-get install -y -qq libvulkan1 vulkan-tools libnvidia-gl-580-server libgomp1
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y -qq nodejs
  fi
  sudo npm install -g @playcanvas/splat-transform@3.5.1 >/dev/null 2>&1
  sudo mkdir -p /usr/share/vulkan/icd.d
  printf '%s' '{"file_format_version":"1.0.0","ICD":{"library_path":"libGLX_nvidia.so.0","api_version":"1.3.242"}}' \
    | sudo tee /usr/share/vulkan/icd.d/nvidia_icd.json >/dev/null
  say "node $(node -v), splat-transform $(splat-transform --version 2>/dev/null | head -1)"
  vulkaninfo --summary 2>/dev/null | grep -iE 'deviceName|driverName' | head -4 || true
}

# --- stage helpers -------------------------------------------------------
have() { gcs ls "$ETL_PREFIX/work/$1/$2" >/dev/null 2>&1; }
stamp() { echo "ok $(date -u +%FT%TZ)" | gcs cp - "$ETL_PREFIX/work/$1/$2"; }

stage() {  # stage <job> <marker> <local-out> <args...>
  local job="$1" marker="$2" out="$3"; shift 3
  if have "$job" "$marker"; then say "  skip $marker (already in GCS)"; return 0; fi
  say "  run  $marker"
  if ! splat-transform -w "$@"; then say "  FAIL $marker"; return 1; fi
  [ -f "$out" ] || { say "  FAIL $marker (no output $out)"; return 1; }
  gcs cp "$out" "$ETL_PREFIX/work/$job/$(basename "$out")" && stamp "$job" "$marker"
}

stage_dir() {  # stage_dir <job> <marker> <local-dir>
  local job="$1" marker="$2" dir="$3"
  if have "$job" "$marker"; then say "  skip $marker (already in GCS)"; return 0; fi
  say "  run  $marker"
  [ -d "$dir" ] || return 1
  ( cd "$(dirname "$dir")" && tar czf "$JOB_DIR/sog.tgz" "$(basename "$dir")" ) || return 1
  gcs cp "$JOB_DIR/sog.tgz" "$ETL_PREFIX/work/$job/sog.tgz" && stamp "$job" "$marker"
}

# A "raw" value may be a single URI, or a merge list separated by " ; " where
# each entry is  uri[|t=x,y,z][|r=x,y,z][|s=f] .  Multiple entries are merged in
# stage 0 with splat-transform's per-input transforms, which is how the A2
# multi-pass captures (forward / return / lateral / FastH3-filled heading) are
# combined into one scene before any filtering or encoding.
fetch_or_merge_raw() {
  local job="$1" raw="$2" W="$JOB_DIR/$job"
  [ -f "$W/raw.ply" ] && { say "  raw.ply already local"; return 0; }
  if [ -f "$W/merged.marker" ]; then
    say "  restoring merged raw from GCS"
    gcs cp "$ETL_PREFIX/work/$job/raw.ply" "$W/raw.ply" && return 0
  fi
  local n=$(printf '%s' "$raw" | tr ';' '\n' | grep -c .)
  if [ "$n" -le 1 ]; then
    say "  fetch raw (single input)"
    gcs cp "$raw" "$W/raw.ply" || return 1
    return 0
  fi
  say "  merge $n inputs (A2 multi-pass)"
  local args=() i=0 spec uri t r sc
  local IFS=';'
  for spec in $raw; do
    spec=$(printf '%s' "$spec" | sed 's/^ *//;s/ *$//')
    [ -z "$spec" ] && continue
    uri="${spec%%|*}"; t=""; r=""; sc=""
    local rest="${spec#*|}"
    [ "$rest" != "$spec" ] && {
      local IFS2='|'
      for kv in $rest; do
        case "$kv" in
          t=*) t="-t ${kv#t=}" ;;
          r=*) r="-r ${kv#r=}" ;;
          s=*) sc="-s ${kv#s=}" ;;
        esac
      done
    }
    i=$((i+1))
    local f="$W/in${i}.ply"
    say "    in${i} <- $uri ${t:+$t} ${r:+$r} ${sc:+$sc}"
    gcs cp "$uri" "$f" || return 1
    args+=( -w "$f" )
    [ -n "$t" ] && args+=( $t )
    [ -n "$r" ] && args+=( $r )
    [ -n "$sc" ] && args+=( $sc )
  done
  local t0=$SECONDS
  splat-transform "${args[@]}" "$W/raw.ply" || return 1
  say "  merged in $((SECONDS-t0))s -> $(du -h "$W/raw.ply" | cut -f1)"
  touch "$W/merged.marker"
  gcs cp "$W/raw.ply" "$ETL_PREFIX/work/$job/raw.ply" || true
  return 0
}

process_job() {
  local job="$1" raw="$2" box="$3" cluster="$4" decimate="$5"
  local YAW="${6:-0}"
  local W="$JOB_DIR/$job"
  say "job=$job  raw=$raw"
  mkdir -p "$W" "$W/sog"
  fetch_or_merge_raw "$job" "$raw" || return 1

  # 0. one-time Morton (Z-order) prepass.
  #    splat-transform warns "input is spatially incoherent (scattered gathers
  #    expected)" for the raw Lyra output — its Gaussians are in no spatial order,
  #    so every later pass does random gathers. Sorting by Morton code once turns
  #    those into sequential reads and is the single biggest CPU-side win, which
  #    matters because decimation/encoding are CPU-bound (the L4 only accelerates
  #    voxelisation and WebP/SOG compression).
  if ! have "$job" morton.done; then
    if [ ! -f "$W/raw.morton.ply" ]; then
      stage "$job" morton.done "$W/raw.morton.ply" "$W/raw.ply" -m "$W/raw.morton.ply" || return 1
    else
      gcs cp "$W/raw.morton.ply" "$ETL_PREFIX/work/$job/raw.morton.ply" && stamp "$job" morton.done
    fi
  else
    say "  skip morton.done"
    [ -f "$W/raw.morton.ply" ] || gcs cp "$ETL_PREFIX/work/$job/raw.morton.ply" "$W/raw.morton.ply" || true
  fi
  # every later stage prefers the Morton-ordered input when it is available
  local SRC="$W/raw.ply"
  [ -f "$W/raw.morton.ply" ] && SRC="$W/raw.morton.ply"

  # 1. clip the km-scale outliers so later GPU buffers stay inside Dawn's limits
  #    The Lyra/COLMAP source frame is (x right, y DOWN, z forward). The viewer
  #    expects three.js Y-up ENU, so we apply `-r 180,0,0` then the seed-camera
  #    heading `-r 0,<yaw>,0` exactly as scripts/vps/lyra_to_sog.py does. Without
  #    this the cloud is upside-down and z-flipped and the first-person camera
  #    looks at empty space, which renders as a perfectly black frame.
  if ! have "$job" core.done; then
    if [ ! -f "$W/core.ply" ]; then
      stage "$job" core.done "$W/core.ply" "$SRC" --filter-nan --filter-box "$box" \
        -r 180,0,0 -r "0,${YAW:-0},0" \
        --decimate "${CORE_DECIMATE:-45%}" "$W/core.ply" || return 1
    else
      gcs cp "$W/core.ply" "$ETL_PREFIX/work/$job/core.ply" && stamp "$job" core.done
    fi
  else say "  skip core.done"; fi

  # 2. GPU cluster prune on the clipped core.
  #    BEST-EFFORT: this is the one filter that goes through Dawn's GPU
  #    voxelisation, and on the NVIDIA Vulkan driver it trips a bind-group
  #    validation limit (CreateBindGroup) that LLVM/llvmpipe and Apple's Dawn do
  #    not. Failing it must not lose the whole job, so we fall back to the
  #    clipped core and let decimate + encode still produce a usable splat.
  if ! have "$job" clustered.done; then
    [ -f "$W/core.ply" ] || gcs cp "$ETL_PREFIX/work/$job/core.ply" "$W/core.ply" || return 1
    if splat-transform -w "$W/core.ply" --filter-cluster "$cluster" --seed-pos 0,0,0 "$W/clustered.ply"; then
      gcs cp "$W/clustered.ply" "$ETL_PREFIX/work/$job/clustered.ply" && stamp "$job" clustered.done
    else
      say "  WARN clustered.done failed (Dawn bind-group limit on this driver) — continuing without the cluster prune"
      cp "$W/core.ply" "$W/clustered.ply"
    fi
  else say "  skip clustered.done"; fi

  # 3. OPTIONAL adaptive decimate.
  #    Stage 1 already decimated uniformly, so a second decimate usually buys
  #    little for a lot of CPU: measured at 381% CPU / 4% GPU for 12+ min on the
  #    L4, i.e. the GPU sat idle. Only run it when FINAL_DECIMATE is set; by
  #    default we pass the clustered cloud straight to the encoder, which IS
  #    GPU-accelerated (WebP / SOG compression uses the L4).
  if ! have "$job" final.done; then
    [ -f "$W/clustered.ply" ] || gcs cp "$ETL_PREFIX/work/$job/clustered.ply" "$W/clustered.ply" || return 1
    if [ -n "${FINAL_DECIMATE:-}" ]; then
      stage "$job" final.done "$W/final.ply" "$W/clustered.ply" --decimate-adaptive "$FINAL_DECIMATE" "$W/final.ply" || return 1
    else
      cp "$W/clustered.ply" "$W/final.ply"
      gcs cp "$W/final.ply" "$ETL_PREFIX/work/$job/final.ply" && stamp "$job" final.done
      say "  final.done = clustered cloud (skipped the CPU-only adaptive decimate)"
    fi
  else say "  skip final.done"; fi

  # 4. encode : SPZ v3 (viewer) + SOG (archive)
  [ -f "$W/final.ply" ] || gcs cp "$ETL_PREFIX/work/$job/final.ply" "$W/final.ply" || return 1
  stage "$job" spz.done "$W/final.spz" "$W/final.ply" "$W/final.spz" --spz-version 3 || return 1
  if ! have "$job" sog.done; then
    [ -f "$W/sog/meta.json" ] || { mkdir -p "$W/sog"; splat-transform -w "$W/final.ply" "$W/sog/meta.json" >/dev/null 2>&1; }
    stage_dir "$job" sog.done "$W/sog" || return 1
  else say "  skip sog.done"; fi

  stamp "$job" job.done
  say "job=$job COMPLETE"
}

main() {
  say "=== splat ETL worker starting ==="
  install_toolchain
  gcs cp "$ETL_PREFIX/jobs.json" "$JOB_DIR/jobs.json" || { say "no jobs.json"; return 1; }

  # jobs.json: {"jobs":[{"id","raw","box","cluster","decimate"}, ...]}
  python3 - "$JOB_DIR/jobs.json" > "$JOB_DIR/joblist" <<'PY'
import json, sys
spec = json.load(open(sys.argv[1]))
print(spec.get("etl_prefix", ""))
for j in spec["jobs"]:
    print("\t".join([j["id"], j["raw"], j.get("box", "-400,-400,-400,400,400,400"),
                     j.get("cluster", "2.0,0.999,0.15"), j.get("decimate", "70%"),
                     str(j.get("yaw", 0))]))
PY
  local prefix; prefix=$(head -1 "$JOB_DIR/joblist")
  [ -n "$prefix" ] && ETL_PREFIX="$prefix"

  tail -n +2 "$JOB_DIR/joblist" | while IFS=$'\t' read -r id raw box cluster dec yaw; do
    [ -z "$id" ] && continue
    if have "$id" job.done; then say "job=$id already complete — skipping"; continue; fi
    process_job "$id" "$raw" "$box" "$cluster" "$dec" "$yaw" || say "job=$id incomplete — next instance will resume"
  done

  # ship the log so the driver can debug a failed run without SSH
  gcs cp "$LOG" "$ETL_PREFIX/work/worker.log" 2>/dev/null || true
  say "=== pass finished ==="
  sync
}

# Long-lived ETL daemon.
#
# The instance is MINE to manage, not the worker's: it must not shut the box
# down just because one pass ended (a failed stage used to trigger exactly that,
# which looked like spurious termination). Instead it re-reads jobs.json on a
# timer so new jobs pushed to GCS are picked up automatically while the spot L4
# stays warm — which is what makes several jobs in one 1-2 h window cheap.
#
#   ETL_ONESHOT=1   process once and exit (used for a single-shot test)
#   ETL_MAX_PASSES=n stop after n passes (default 0 = run until stopped)
main_loop() {
  local passes=0 max="${ETL_MAX_PASSES:-0}"
  while true; do
    main
    passes=$((passes + 1))
    if [ "${ETL_ONESHOT:-0}" = "1" ] || { [ "$max" != "0" ] && [ "$passes" -ge "$max" ]; }; then
      say "exiting after $passes pass(es) — leaving the instance running"
      return 0
    fi
    say "idle: re-checking jobs.json in ${ETL_POLL_SECS:-60}s (VM stays up)"
    sleep "${ETL_POLL_SECS:-60}"
  done
}

main_loop "$@"
