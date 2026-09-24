// src/features/landing/survey/stations.ts
//
// The control network shown on the landing page, and the epochs it is observed
// in. Coordinates are the real anchors the reconstructions are geo-registered
// to (WGS84, from the world manifest and the OSM trail relation for the
// Circuit des 25 Bosses).
//
// IMPORTANT: the positional sigmas, epoch deltas and baseline lengths are
// ILLUSTRATIVE of the method, not surveyed results. They are the shape of the
// output a re-observation produces. The page labels them as synthetic.

export type StationSource = 'lidar-hd' | 'world-model' | 'panoramax' | 'flythrough';

export type Station = {
  /** Control-point designation, as it would be written on a survey sheet. */
  id: string;
  name: string;
  /** Real anchor, WGS84. */
  lat: number;
  lng: number;
  /** What the position was recovered from, and how it was captured. */
  source: StationSource;
  capture: string;
  /** Ground elevation (m), from the Copernicus/SRTM DEM in the repo. */
  elevation: number;
  /** Positional sigma per epoch, metres. Illustrative. */
  sigma: number;
  /** Change against the preceding epoch, metres. Illustrative. */
  delta: number;
  /** Frames or tiles contributing to the reconstruction. */
  observations: number;
  /** Gaussian count in the published splat, where one exists. */
  gaussians?: number;
};

export type Epoch = {
  stamp: string;
  /** What is true about this epoch, in one line. */
  note: string;
};

/**
 * Epochs of the same network. The point of the page's control is that pulling
 * it re-reads every station at once — no navigation, no reload.
 */
export const EPOCHS: Epoch[] = [
  { stamp: '2026-03', note: 'first observation of the full circuit' },
  { stamp: '2026-06', note: 're-observed after the spring runoff' },
  { stamp: '2026-09', note: 'current epoch — three stations restated' },
];

export const STATIONS: Station[] = [
  {
    id: 'STN 01',
    name: 'Circuit des 25 Bosses — sandy trail, red blaze',
    lat: 48.37796,
    lng: 2.52894,
    source: 'flythrough',
    capture: 'drone flythrough, 1 clip',
    elevation: 95,
    sigma: 0.031,
    delta: -0.041,
    observations: 162,
    gaussians: 5018461,
  },
  {
    id: 'STN 02',
    name: 'Rocher de la Tortue — perforated sandstone boulder',
    lat: 48.37592,
    lng: 2.5427,
    source: 'world-model',
    capture: 'world model from imagery',
    elevation: 88,
    sigma: 0.014,
    delta: -0.082,
    observations: 162,
    gaussians: 4989571,
  },
  {
    id: 'STN 03',
    name: 'Croix de Lorraine — Maquis monument clearing',
    lat: 48.39,
    lng: 2.508,
    source: 'world-model',
    capture: 'world model from imagery',
    elevation: 110,
    sigma: 0.019,
    delta: 0.006,
    observations: 162,
    gaussians: 4988394,
  },
  {
    id: 'STN 04',
    name: 'Panoramax pano — 25 Bosses trailhead',
    lat: 48.37804,
    lng: 2.52464,
    source: 'panoramax',
    capture: 'street-level panorama',
    elevation: 95,
    sigma: 0.044,
    delta: -0.012,
    observations: 128,
    gaussians: 4932682,
  },
  {
    id: 'STN 05',
    name: 'Panoramax pano — 25 Bosses forest edge',
    lat: 48.37804,
    lng: 2.52464,
    source: 'panoramax',
    capture: 'street-level panorama',
    elevation: 95,
    sigma: 0.038,
    delta: 0.023,
    observations: 128,
    gaussians: 4998757,
  },
  {
    id: 'STN 06',
    name: 'IGN LiDAR HD — tile reference surface',
    lat: 48.3812,
    lng: 2.5361,
    source: 'lidar-hd',
    capture: 'national LiDAR coverage',
    elevation: 101,
    sigma: 0.008,
    delta: 0.0,
    observations: 1,
  },
];

/** Label the illustrative figures honestly, wherever they are shown. */
export const SYNTHETIC_NOTE
  = 'Sigmas, epoch deltas and baseline lengths are illustrative of the method, not surveyed results.';
