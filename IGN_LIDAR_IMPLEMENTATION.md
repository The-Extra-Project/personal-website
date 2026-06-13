# IGN LiDAR HD Integration Notes

## What changed

The previous homepage viewer was not a point cloud. It decoded a single Terrarium elevation PNG and turned it into a shaded terrain mesh.

The replacement uses the IGN LiDAR HD coverage index surfaced through the EU dataset portal:

- `https://data.europa.eu/data/datasets/ignf_nuages-de-points-lidar-hd?locale=fr`
- `index.vpc` from `https://data.geopf.fr/chunk/telechargement/download/lidarhd_fxx_ept/vpc-128/index.vpc`
- each feature resolves to an `ept.json` manifest
- the browser streams octree nodes on demand through Potree

The Potree runtime is vendored locally from the official Potree 1.8.2 GitHub release bundle.

## Why this is the cheapest serverless option

- No backend point-cloud conversion service is needed.
- No PDAL runtime is needed in production.
- No mesh reconstruction worker is needed at request time.
- Static hosting is enough because IGN already publishes an indexed hierarchy.
- The viewer only requests nodes near the current camera instead of downloading raw `.laz` tiles.
- The app no longer depends on `potree.org` at runtime.

## Why not reconstruct a 3D mesh in the browser

Surface reconstruction from LiDAR is a different workload from point-cloud streaming.

- Meshing adds a heavy CPU and memory cost.
- Good reconstruction usually needs offline cleanup, denoising, classification filters, and tiling.
- Doing that per request in a serverless function is the wrong cost profile.

If you need a real reconstructed surface, the correct pipeline is:

1. resolve the area of interest to COPC/LAZ tiles
2. preprocess offline with PDAL or a meshing pipeline
3. publish a derived mesh or 3D Tiles dataset
4. stream the derivative in the browser

## Production-grade next step

For the strongest long-term setup, switch from the remote Potree runtime used here to one of these:

1. host Potree assets locally and keep the same EPT-based flow
2. convert selected areas to 3D Tiles and render them with Giro3D
3. stream IGN COPC tiles directly once you have a stable tile lookup API for your target areas

## Current tradeoffs

- This implementation renders actual streamed points, not a reconstructed mesh.
- Camera placement is derived from the requested WGS84 coordinate and Lambert-93 reprojection.
- The selected dataset is regional, so the viewer is efficient but still depends on the chosen camera target to stay focused.
- Availability depends on IGN publication coverage for the requested location.
