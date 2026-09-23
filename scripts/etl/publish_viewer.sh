#!/usr/bin/env bash
# Publish the Lyra worlds the /sim viewer reads.
#
# The splat assets are hundreds of MB and `public/**` is gitignored, so nothing
# under public/drone/lyra ships in the repo. Instead this mirrors the local
# build output to a **public** GCS bucket, and the viewer fetches everything
# (registry JSON, .spz, SOG) from it at runtime via NEXT_PUBLIC_SPLAT_BASE_URL.
#
# Why a version prefix: GCS edge-caches public objects. A copy cached before the
# bucket had its CORS policy keeps answering without Access-Control-Allow-Origin,
# and the browser surfaces that as an opaque `TypeError: Failed to fetch` — the
# objects look fine to curl while the app can never load them. Publishing to a
# fresh `v<N>/` path gives every object a new cache key. Bump VERSION when the
# assets change and update `SPLAT_BASE_URL` in src/features/splat/registry.ts.
#
# Two buckets are involved on purpose:
#   STAGE  gs://meghdoot-artifacts/etl/viewer   private, written by the ETL
#   PUBLIC gs://meghdoot-viewer-public          allUsers:objectViewer
# The main artifact bucket enforces public-access-prevention, and disabling that
# would expose every object in it, so the viewer gets its own bucket instead.
#
# Usage:
#   scripts/etl/publish_viewer.sh                 # all scenes, current VERSION
#   VERSION=v2 scripts/etl/publish_viewer.sh      # roll the cache
#   scripts/etl/publish_viewer.sh roche-tortue    # one scene
set -euo pipefail
cd "$(dirname "$0")/../.."

STAGE="${SPLAT_STAGE_BUCKET:-gs://meghdoot-artifacts/etl/viewer}"
PUBLIC_BUCKET="meghdoot-viewer-public"
PUBLIC="gs://$PUBLIC_BUCKET"
VERSION="${VERSION:-v1}"
LYRA=public/drone/lyra
ONLY="${1:-}"

say() { printf '  %s\n' "$*"; }

[ -f "$LYRA/manifest.json" ] || { echo "missing $LYRA/manifest.json — run the ETL first"; exit 1; }
[ -f "$LYRA/sog-report.json" ] || { echo "missing $LYRA/sog-report.json"; exit 1; }

# ---------------------------------------------------------------- CORS (once)
# `gcloud storage buckets update --cors-file` silently fails to persist this, so
# go through the JSON API, which does.
cors=$(gcloud storage buckets describe "$PUBLIC" --format=json 2>/dev/null \
  | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin).get('cors') or []))")
if [ "$cors" = "[]" ] || [ "$cors" = "null" ]; then
  say "setting bucket CORS"
  token=$(gcloud auth print-access-token)
  curl -s -X PATCH -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
    "https://storage.googleapis.com/storage/v1/b/$PUBLIC_BUCKET?fields=cors" \
    -d '{"cors":[{"origin":["*"],"method":["GET","HEAD"],"responseHeader":["Content-Type","Content-Length","Content-Range","Accept-Ranges","Range","ETag","Last-Modified"],"maxAgeSeconds":3600}]}' \
    >/dev/null
fi

# ------------------------------------------------------------------ upload
say "registry documents -> $STAGE/$VERSION"
gcloud storage cp "$LYRA/manifest.json" "$STAGE/$VERSION/manifest.json" >/dev/null
gcloud storage cp "$LYRA/sog-report.json" "$STAGE/$VERSION/sog-report.json" >/dev/null

say "splats -> $STAGE/$VERSION/splat"
if [ -n "$ONLY" ]; then
  gcloud storage cp "$LYRA/splat/$ONLY.spz" "$STAGE/$VERSION/splat/$ONLY.spz" >/dev/null
else
  gcloud storage cp "$LYRA/splat/"*.spz "$STAGE/$VERSION/splat/" >/dev/null
fi

say "mirror into $PUBLIC/$VERSION"
gcloud storage cp -r "$STAGE/$VERSION/*" "$PUBLIC/$VERSION/" >/dev/null

# ------------------------------------------------------------------ verify
say "verify public + CORS"
base="https://storage.googleapis.com/$PUBLIC_BUCKET/$VERSION"
fail=0
check() { # url expected
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -r 0-1023 -H "Origin: http://localhost:3000" "$1")
  [ "$code" = "$2" ] || [ "$code" = "200" ] || { echo "  $1 -> $code"; fail=1; }
  say "$(basename "$1") -> $code"
}
check "$base/manifest.json" 200
check "$base/sog-report.json" 200
for id in $(python3 -c "
import json
d=json.load(open('$LYRA/sog-report.json'))
print(' '.join(s['id'] for s in d['scenes']))"); do
  check "$base/splat/$id.spz" 206
done

say "viewer base: $base"
exit "$fail"
