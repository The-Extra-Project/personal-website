#!/usr/bin/env bash
# Pull every finished ETL section (final.spz) into the viewer, and write the
# seed-camera pose + counts into sog-report.json.
#
# The pose matters: the Lyra source is in COLMAP frame (y DOWN, z forward) and
# the worker reorients it to three.js Y-up ENU with `-r 180,0,0` + `-r 0,<yaw>,0`.
# If sog-report.json has no camera_origin/camera_forward the registry falls back
# to a yaw-derived forward and the camera ends up looking away from the cloud,
# which renders as a perfectly black frame (that is the bug this fixes).
set -euo pipefail
cd "$(dirname "$0")/../.."
B=gs://meghdoot-artifacts/etl/work

# yaw must match scripts/vps/lyra_to_sog.py WORLDS (the seed-camera heading)
declare -A YAW=(
  [roche-tortue]=-35 [trail-ascent]=20 [croix-lorraine]=180
  [pano-06d14b03]=0 [pano-175106e9]=0 [yt-seg11]=0 [a2-roche-tortue]=-35
)

for id in roche-tortue trail-ascent croix-lorraine pano-06d14b03 pano-175106e9 yt-seg11 a2-roche-tortue; do
  gs="$B/$id/final.spz"
  gcloud storage ls "$gs" >/dev/null 2>&1 || { echo "  $id: not ready"; continue; }
  mkdir -p public/drone/lyra/splat
  gcloud storage cp "$gs" "public/drone/lyra/splat/$id.spz" >/dev/null 2>&1
  n=$(npx splat-transform "public/drone/lyra/splat/$id.spz" --info json null 2>/dev/null \
      | python3 -c "import sys,json;t=sys.stdin.read();i=t.find('{');j=t.rfind('}')+1;print(json.loads(t[i:j]).get('numGaussians',0))" 2>/dev/null || echo 0)
  python3 - "$id" "$n" "${YAW[$id]}" <<'PY'
import json, math, pathlib, sys
sid, n, yaw = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
pose = {"camera_origin": [0.0, 0.0, 0.0],
        "camera_forward": [round(-math.sin(math.radians(yaw)), 5), 0.0, round(-math.cos(math.radians(yaw)), 5)],
        "scale": 1}
for f, key in (("public/drone/lyra/sog-report.json", "scenes"), ("public/drone/lyra/manifest.json", "worlds")):
    p = pathlib.Path(f); d = json.loads(p.read_text())
    for s in d.get(key, []):
        if s.get("id") == sid:
            s["gaussians"] = n
            if key == "scenes":
                s.update(pose)
    p.write_text(json.dumps(d, indent=2) + "\n")
PY
  echo "  $id: installed ($n gaussians, yaw ${YAW[$id]})"
done
