#!/usr/bin/env bash
# Spot-L4 ETL driver — runs locally.
#
#   scripts/etl/splat_etl.sh run          create/start the spot VM and let the worker drain jobs.json
#   scripts/etl/splat_etl.sh status       show per-stage checkpoints in GCS
#   scripts/etl/splat_etl.sh fetch        pull finished .spz / sog.tgz to public/drone/lyra/splat
#   scripts/etl/splat_etl.sh stop         stop the VM (disk kept, billing stops)
#   scripts/etl/splat_etl.sh delete       delete the VM + boot disk
#
# Design notes for spot:
#   * --instance-termination-action=DELETE keeps the boot disk on a reclaim, so a
#     restart resumes rather than rebuilding. Only the disk costs anything while
#     the VM is stopped (a few cents/day).
#   * every stage checkpoints to GCS before the next one starts, so a reclaim
#     costs at most one stage of work.
#   * the startup script is idempotent: it reinstalls nothing if the toolchain
#     and NVIDIA Vulkan are already on the disk.
set -uo pipefail

PROJECT="${PROJECT:-ultimate3dreconstructionstack}"
ZONE="${ZONE:-us-east1-b}"
INSTANCE="${INSTANCE:-splat-gpu}"
MACHINE="${MACHINE:-g2-standard-4}"        # 4 vCPU / 16 GB + 1x L4
IMAGE_FAMILY="${IMAGE_FAMILY:-common-cu129-ubuntu-2204-nvidia-580}"
IMAGE_PROJECT="${IMAGE_PROJECT:-deeplearning-platform-release}"
ETL_PREFIX="${ETL_PREFIX:-gs://meghdoot-artifacts/etl}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

gcs() { gcloud storage "$@" 2>/dev/null || gsutil "$@"; }
say() { echo "[etl] $*"; }

startup_script() {
  cat <<EOF
#!/bin/bash
# Spot-L4 bootstrap: fetch the worker from GCS and run it. Idempotent.
set -uo pipefail
exec > /var/log/splat-etl.log 2>&1
trap 'echo "SIGTERM (spot reclaim)"; exit 143' TERM
mkdir -p /mnt/job
for i in \$(seq 1 30); do
  gcloud storage cp ${ETL_PREFIX}/splat_worker.sh /mnt/job/splat_worker.sh 2>/dev/null && break
  sleep 5
done
chmod +x /mnt/job/splat_worker.sh
ETL_PREFIX=${ETL_PREFIX} /mnt/job/splat_worker.sh
EOF
}

cmd_run() {
  [ -f "$REPO/scripts/etl/splat_worker.sh" ] || { say "worker script missing"; exit 1; }
  [ -f "$REPO/scripts/etl/jobs.json" ]      || { say "jobs.json missing"; exit 1; }

  say "uploading worker + job spec -> $ETL_PREFIX"
  gcs cp "$REPO/scripts/etl/splat_worker.sh" "$ETL_PREFIX/splat_worker.sh"
  gcs cp "$REPO/scripts/etl/jobs.json"       "$ETL_PREFIX/jobs.json"

  local ss; ss="$(mktemp)"; startup_script > "$ss"

  if gcloud compute instances describe "$INSTANCE" --zone="$ZONE" >/dev/null 2>&1; then
    say "instance exists — deleting so the next boot gets a working NVIDIA Vulkan lib"
    gcloud compute instances delete "$INSTANCE" --zone="$ZONE" --quiet >/dev/null 2>&1 || true
    sleep 5
  fi
  if true; then
    # Spot L4 capacity moves around; walk the zones that have nvidia-l4 until one
    # accepts. g2-standard-4 exists in all of these.
    local ok=0
    for Z in ${ZONES:-us-east1-b us-east1-c us-east1-d us-east4-a us-west1-a us-west1-b us-central1-a us-central1-b europe-west1-b europe-west4-a}; do
      say "trying spot L4 in $Z ~\$0.43/hr"
      if gcloud compute instances create "$INSTANCE" \
           --zone="$Z" --machine-type="$MACHINE" \
           --accelerator=type=nvidia-l4,count=1 \
           --maintenance-policy=TERMINATE --provisioning-model=SPOT \
           --instance-termination-action=DELETE \
           --image-family="$IMAGE_FAMILY" --image-project="$IMAGE_PROJECT" \
           --boot-disk-size=100GB --boot-disk-type=pd-balanced \
           --scopes=cloud-platform --labels=purpose=splat-etl \
           --metadata-from-file=startup-script="$ss" \
           --format="value(name,status,zone)" 2>&1 | tail -2 | tee /tmp/etl-create.txt | grep -qE "RUNNING|PROVISIONING|STAGING"; then
        ZONE="$Z"; ok=1; say "created in $Z"; break
      fi
      grep -q "Invalid value for field 'resource.machineType'" /tmp/etl-create.txt && continue
      sleep 4
    done
    [ "$ok" = "1" ] || { say "no zone had spot L4 capacity — try again shortly, or set ZONES=..."; rm -f "$ss"; exit 1; }
  fi
  rm -f "$ss"
  say "worker is bootstrapping — follow with:  $0 status"
}

cmd_status() {
  say "checkpoints under $ETL_PREFIX/work/"
  local out; out="$(gcs ls -r "$ETL_PREFIX/work/" 2>/dev/null | grep -E '\.done$' | sed 's|.*/work/||')"
  if [ -z "$out" ]; then echo "  (none yet)"; else echo "$out" | sed 's/^/  /'; fi
  echo
  say "instance: $(gcloud compute instances describe "$INSTANCE" --zone="$ZONE" --format='value(status)' 2>/dev/null || echo absent)"
  say "last worker log lines:"
  gcloud compute ssh "$INSTANCE" --zone="$ZONE" --ssh-flag="-o StrictHostKeyChecking=no" \
    --command="sudo tail -6 /var/log/splat-etl.log 2>/dev/null" 2>/dev/null | sed 's/^/  /' || echo "  (unreachable)"
}

cmd_fetch() {
  local dest="$REPO/public/drone/lyra/splat"
  mkdir -p "$dest"
  say "downloading finished artifacts -> $dest"
  gcs ls "$ETL_PREFIX/work/" 2>/dev/null | sed 's|.*/work/||; s|/$||' | while read -r job; do
    [ -z "$job" ] && continue
    if gcs ls "$ETL_PREFIX/work/$job/final.spz" >/dev/null 2>&1; then
      gcs cp "$ETL_PREFIX/work/$job/final.spz" "$dest/$job.spz" && say "  $job.spz"
    fi
  done
  say "now register them:  python3 scripts/vps/add_yt_scene.py --id <job> ... (keeps the existing UI)"
}

cmd_stop()   { gcloud compute instances stop   "$INSTANCE" --zone="$ZONE" 2>&1 | tail -1; }
cmd_delete() { gcloud compute instances delete "$INSTANCE" --zone="$ZONE" --quiet 2>&1 | tail -1; }

case "${1:-}" in
  run)    cmd_run ;;
  status) cmd_status ;;
  fetch)  cmd_fetch ;;
  stop)   cmd_stop ;;
  delete) cmd_delete ;;
  *) sed -n '2,20p' "$0" ;;
esac
