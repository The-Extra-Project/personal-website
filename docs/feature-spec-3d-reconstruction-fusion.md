# Feature Specification: 3D Reconstruction Fusion Browser
## COPC Point Clouds + Gaussian Splatting Pipeline

**Document Version:** 1.0  
**Date:** January 2025  
**Status:** Draft  
**Authors:** Engineering Team  
**Stakeholders:** Raphe UAV Company, Product Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [User Personas](#user-personas)
4. [User Stories](#user-stories)
5. [Functional Requirements](#functional-requirements)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [Technical Architecture](#technical-architecture)
8. [Data Pipeline](#data-pipeline)
9. [Benchmark Methodology](#benchmark-methodology)
10. [UI/UX Specifications](#uiux-specifications)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Appendices](#appendices)

---

## Executive Summary

Raphe, a UAV research and manufacturing company, seeks to enhance their current 3D mapping workflow by fusing high-density LiDAR point clouds (COPC format from IGN LiDAR HD) with photogrammetric reconstructions using Gaussian Splatting. The current pipeline relies on WebODM and Pix4D, which have limitations in scalability and reconstruction quality.

This specification defines a web-based 3D reconstruction browser that:
- **Fuses** COPC point clouds with Gaussian splatting reconstructions from drone imagery
- **Compares** reconstruction quality against Pix4D and WebODM baselines
- **Enables** layer selection between raw LiDAR, dense reconstruction, and neural rendering
- **Provides** benchmarking tools for quantitative evaluation of reconstruction pipelines

### Key Value Propositions
1. **Enhanced Reconstruction Quality**: Combine geometric accuracy of LiDAR with photorealistic rendering of Gaussian splatting
2. **Scalability**: Handle large-scale urban environments (1km²+ tiles) through octree-based streaming
3. **Flexibility**: Support multiple reconstruction methods (WebODM, Nerfstudio, Pix4D)
4. **Benchmarking**: Quantitative comparison framework for reconstruction quality metrics

---

## Problem Statement

### Current Limitations
1. **WebODM/Pix4D Constraints**:
   - Limited scalability for large datasets
   - Proprietary formats restrict integration
   - Lack of real-time visualization for massive point clouds
   - No native support for neural rendering techniques

2. **Data Silos**:
   - LiDAR HD data (COPC format) exists separately from photogrammetric reconstructions
   - No unified viewer for comparing reconstruction methods
   - Difficulty in fusing multi-modal 3D data (LiDAR + imagery)

3. **Benchmarking Gaps**:
   - No standardized framework for comparing Pix4D vs. custom pipelines
   - Lack of quantitative metrics for reconstruction quality
   - Difficulty in validating reconstruction accuracy against ground truth

### Opportunity
Leverage recent advances in 3D Gaussian Splatting (3DGS) and existing IGN LiDAR HD infrastructure to create a next-generation 3D reconstruction browser that combines:
- **Geometric accuracy** from LiDAR HD (COPC point clouds)
- **Photorealistic rendering** from Gaussian splatting
- **Scalable visualization** via Potree's octree streaming
- **Open-source tooling** (WebODM, Nerfstudio, OpenSfM)

---

## User Personas

### Persona 1: UAV Operator (Primary)
**Name:** Marc, UAV Fleet Operator at Raphe  
**Goals:**
- Capture high-quality aerial imagery for 3D reconstruction
- Compare reconstruction quality across different pipelines
- Validate reconstruction accuracy against LiDAR ground truth

**Pain Points:**
- Current tools (Pix4D) are slow and expensive
- Difficulty in visualizing large datasets
- No way to quantitatively compare reconstruction methods

**Workflow:**
1. Plan UAV mission with overlapping imagery
2. Upload imagery to reconstruction pipeline
3. View fused LiDAR + reconstruction in browser
4. Compare against Pix4D baseline using benchmarking tools

---

### Persona 2: Data Scientist / ML Engineer
**Name:** Sarah, Computer Vision Engineer  
**Goals:**
- Experiment with different reconstruction algorithms (NeRF, 3DGS, MVS)
- Tune hyperparameters for optimal reconstruction quality
- Benchmark new methods against established baselines

**Pain Points:**
- Lack of standardized benchmarking framework
- Difficulty in integrating custom models with visualization tools
- No access to ground truth data for validation

**Workflow:**
1. Select area of interest (AOI) from IGN LiDAR HD catalog
2. Download corresponding drone imagery (YouTube, Google Earth, or proprietary)
3. Run reconstruction pipeline (WebODM, Nerfstudio, custom)
4. Visualize and benchmark results in unified browser

---

### Persona 3: Product Manager / Decision Maker
**Name:** Jean-Pierre, CTO at Raphe  
**Goals:**
- Evaluate ROI of custom reconstruction pipeline vs. commercial tools (Pix4D)
- Understand performance trade-offs (quality vs. speed vs. cost)
- Make data-driven decisions on technology stack

**Pain Points:**
- Lack of quantitative data for decision making
- Difficulty in comparing proprietary vs. open-source solutions
- No clear migration path from current tools

**Workflow:**
1. Review benchmarking reports comparing Pix4D vs. custom pipeline
2. Evaluate cost savings from open-source tooling
3. Assess reconstruction quality improvements from Gaussian splatting
4. Make decision on technology adoption

---

## User Stories

### Epic 1: Data Acquisition & Preprocessing

**Story 1.1: Select Area of Interest (AOI)**
- **As a** UAV operator
- **I want to** select an AOI on a map interface
- **So that** I can download corresponding LiDAR HD tiles and plan drone missions

**Acceptance Criteria:**
- User can draw a bounding box on the map
- System queries IGN LiDAR HD WFS to find overlapping tiles
- System displays available COPC files for download
- User can export AOI as GeoJSON for mission planning

---

**Story 1.2: Download Drone Imagery**
- **As a** data scientist
- **I want to** download drone imagery from multiple sources (YouTube, Google Earth, proprietary)
- **So that** I can use it for reconstruction

**Acceptance Criteria:**
- Support YouTube video download (e.g., Châtelet-les-Halles footage)
- Support Google Earth 3D tile extraction via RenderDoc + Blender pipeline
- Support upload of proprietary UAV imagery
- Automatic metadata extraction (GPS, timestamp, camera parameters)

---

**Story 1.3: Preprocess Imagery**
- **As a** data scientist
- **I want to** preprocess drone imagery (undistortion, color correction, pose estimation)
- **So that** I can feed it into reconstruction pipelines

**Acceptance Criteria:**
- Integration with COLMAP for structure-from-motion (SfM)
- Integration with OpenSfM (via WebODM)
- Automatic camera calibration from EXIF metadata
- Preview of camera poses in 3D viewer

---

### Epic 2: Reconstruction Pipeline

**Story 2.1: Run WebODM Reconstruction**
- **As a** data scientist
- **I want to** run WebODM reconstruction on drone imagery
- **So that** I can generate a dense point cloud and mesh

**Acceptance Criteria:**
- System sends imagery to WebODM API (local or cloud)
- User can configure reconstruction parameters (quality, algorithm)
- System monitors job progress and notifies on completion
- Output: dense point cloud (.laz) and mesh (.obj)

---

**Story 2.2: Run Gaussian Splatting Reconstruction**
- **As a** data scientist
- **I want to** run Nerfstudio (gsplat) reconstruction on drone imagery
- **So that** I can generate a photorealistic neural rendering

**Acceptance Criteria:**
- System sends imagery to Nerfstudio training pipeline
- User can select model (gsplat, nerfacto, instant-ngp)
- System monitors training progress (loss curves, PSNR)
- Output: Gaussian splat file (.ply or .splat)

---

**Story 2.3: Run Pix4D Reconstruction (Baseline)**
- **As a** data scientist
- **I want to** run Pix4D reconstruction on the same imagery
- **So that** I can compare it against custom pipelines

**Acceptance Criteria:**
- System integrates with Pix4D API (Pix4Dmatic or Pix4Dcloud)
- User can upload imagery to Pix4D cloud
- System downloads Pix4D outputs (point cloud, mesh, DSM, orthomosaic)
- Output: Pix4D results in standard formats (.laz, .tif)

---

### Epic 3: Visualization & Fusion

**Story 3.1: Visualize COPC Point Cloud**
- **As a** UAV operator
- **I want to** visualize the COPC point cloud in a web browser
- **So that** I can inspect LiDAR data before reconstruction

**Acceptance Criteria:**
- Integration with Potree viewer (already implemented in `ign-ept-viewer.html`)
- Stream COPC .laz files via HTTP range requests
- Support for large datasets (1km² tile, ~100M points)
- Navigation: orbit, pan, zoom, measure distances

---

**Story 3.2: Visualize Gaussian Splatting**
- **As a** UAV operator
- **I want to** visualize the Gaussian splatting reconstruction in the same viewer
- **So that** I can compare it with LiDAR data

**Acceptance Criteria:**
- Integration of Gaussian splatting renderer (antimatter15/splat or similar)
- Support for .ply (3DGS format) and .splat files
- Real-time rendering at 60+ FPS (for <10M splats)
- Camera synchronization with Potree viewer

---

**Story 3.3: Fuse LiDAR and Gaussian Splatting**
- **As a** UAV operator
- **I want to** overlay Gaussian splatting on top of LiDAR point cloud
- **So that** I can see the combined geometric + photorealistic representation

**Acceptance Criteria:**
- Layer management UI (toggle LiDAR, Gaussian splats, mesh)
- Coordinate alignment (Lambert-93 for LiDAR, WGS84 for splats)
- Opacity control for each layer
- Side-by-side comparison mode (split screen)

---

**Story 3.4: Convert Gaussian Splats to Point Cloud**
- **As a** data scientist
- **I want to** convert Gaussian splats to a dense point cloud
- **So that** I can use it in Potree (which doesn't natively support 3DGS)

**Acceptance Criteria:**
- Integration with 3DGS-to-PC tool (Lewis-Stuart-11/3DGS-to-PC)
- Sample Gaussians at regular intervals to generate point cloud
- Output: .laz file compatible with Potree
- Configurable density (points per cubic meter)

---

### Epic 4: Benchmarking & Evaluation

**Story 4.1: Compute Reconstruction Quality Metrics**
- **As a** data scientist
- **I want to** compute quality metrics (RMSE, PSNR, SSIM) for reconstructions
- **So that** I can quantitatively compare pipelines

**Acceptance Criteria:**
- Compare reconstruction against LiDAR ground truth (COPC)
- Metrics: RMSE (geometric error), PSNR (image quality), SSIM (structural similarity)
- Support for point cloud comparison (CloudCompare integration)
- Generate quality report (PDF or HTML)

---

**Story 4.2: Benchmark Against Pix4D**
- **As a** product manager
- **I want to** see a side-by-side comparison of Pix4D vs. custom pipeline
- **So that** I can evaluate cost vs. quality trade-offs

**Acceptance Criteria:**
- Table comparing metrics (RMSE, processing time, cost)
- Visual comparison (side-by-side viewer)
- Cost analysis (Pix4D license vs. open-source compute costs)
- Export report for stakeholder presentation

---

**Story 4.3: Visualize Error Maps**
- **As a** data scientist
- **I want to** visualize error maps showing differences between reconstructions
- **So that** I can identify areas of poor reconstruction

**Acceptance Criteria:**
- Heat map overlay on 3D viewer (distance from ground truth)
- Histogram of errors (mean, median, std dev)
- Identify outliers (e.g., vegetation, moving objects)
- Export error map as GeoTIFF

---

### Epic 5: UI/UX Features

**Story 5.1: Layer Control Panel**
- **As a** user
- **I want to** control which layers are visible (LiDAR, mesh, Gaussian splats)
- **So that** I can focus on specific data modalities

**Acceptance Criteria:**
- Layer panel with checkboxes for each layer
- Opacity slider for each layer
- Color mapping options (e.g., height, intensity, error)
- Reset view button

---

**Story 5.2: Measurement Tools**
- **As a** UAV operator
- **I want to** measure distances and areas in the 3D viewer
- **So that** I can validate reconstruction accuracy

**Acceptance Criteria:**
- Distance measurement (point-to-point)
- Area measurement (polygon)
- Volume measurement (cut/fill analysis)
- Export measurements as CSV

---

**Story 5.3: Export Reconstruction**
- **As a** user
- **I want to** export the fused reconstruction as a standard format (OBJ, LAZ, PLY)
- **So that** I can use it in other tools (Blender, CloudCompare)

**Acceptance Criteria:**
- Export dialog with format selection
- Include all visible layers or selected layers only
- Preserve coordinate system (Lambert-93 or WGS84)
- Progress indicator for large exports

---

## Functional Requirements

### FR-1: Data Ingestion
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | System must query IGN LiDAR HD WFS to find COPC tiles for a given AOI | High |
| FR-1.2 | System must support download of COPC .laz files from IGN data portal | High |
| FR-1.3 | System must support upload of drone imagery (JPEG, PNG, TIFF) | High |
| FR-1.4 | System must extract metadata from imagery (GPS, timestamp, camera model) | Medium |
| FR-1.5 | System must support YouTube video download for dataset collection | Low |

### FR-2: Reconstruction Pipeline
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | System must integrate with WebODM API for dense reconstruction | High |
| FR-2.2 | System must integrate with Nerfstudio (gsplat) for Gaussian splatting | High |
| FR-2.3 | System must integrate with Pix4D API for baseline comparison | Medium |
| FR-2.4 | System must support COLMAP for structure-from-motion | Medium |
| FR-2.5 | System must support OpenSfM via WebODM | Medium |

### FR-3: Visualization
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | System must render COPC point clouds using Potree | High |
| FR-3.2 | System must render Gaussian splats using WebGL (antimatter15/splat) | High |
| FR-3.3 | System must support layer blending (LiDAR + Gaussian splats) | High |
| FR-3.4 | System must synchronize camera between Potree and Gaussian splatting viewer | High |
| FR-3.5 | System must support conversion from Gaussian splats to point clouds | Medium |

### FR-4: Benchmarking
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | System must compute RMSE between reconstruction and LiDAR ground truth | High |
| FR-4.2 | System must compute PSNR and SSIM for image quality assessment | Medium |
| FR-4.3 | System must generate visual error maps | Medium |
| FR-4.4 | System must support side-by-side comparison of reconstruction methods | High |
| FR-4.5 | System must export benchmarking reports (PDF, HTML) | Medium |

### FR-5: UI/UX
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | System must provide layer control panel | High |
| FR-5.2 | System must provide measurement tools (distance, area, volume) | Medium |
| FR-5.3 | System must support export of reconstructions (OBJ, LAZ, PLY) | Medium |
| FR-5.4 | System must provide navigation controls (orbit, pan, zoom) | High |
| FR-5.5 | System must support full-screen mode | Low |

---

## Non-Functional Requirements

### NFR-1: Performance
| ID | Requirement | Target Metric |
|----|-------------|---------------|
| NFR-1.1 | Point cloud rendering | 60 FPS for <100M points |
| NFR-1.2 | Gaussian splatting rendering | 60 FPS for <10M splats |
| NFR-1.3 | Data loading | <5 seconds for 1km² COPC tile |
| NFR-1.4 | Reconstruction time (WebODM) | <30 minutes for 1000 images |
| NFR-1.5 | Reconstruction time (Nerfstudio) | <2 hours for 1000 images (training) |

### NFR-2: Scalability
| ID | Requirement | Target Metric |
|----|-------------|---------------|
| NFR-2.1 | Maximum point cloud size | 1 billion points |
| NFR-2.2 | Maximum number of images | 10,000 images |
| NFR-2.3 | Concurrent users | 10 users |

### NFR-3: Compatibility
| ID | Requirement | Details |
|----|-------------|---------|
| NFR-3.1 | Browser support | Chrome, Firefox, Edge (latest versions) |
| NFR-3.2 | Coordinate systems | Lambert-93 (EPSG:2154), WGS84 (EPSG:4326) |
| NFR-3.3 | File formats | LAZ, PLY, OBJ, TIF, SPLAT |

### NFR-4: Security
| ID | Requirement | Details |
|----|-------------|---------|
| NFR-4.1 | Data privacy | User uploads must be encrypted at rest |
| NFR-4.2 | API authentication | OAuth2 for Pix4D and WebODM APIs |
| NFR-4.3 | Access control | Role-based access (admin, user, viewer) |

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (TypeScript + React)              │   │
│  │  - AOI Selection (Mapbox GL JS)                    │   │
│  │  - Layer Control Panel                              │   │
│  │  - Benchmarking Dashboard                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Potree Viewer (WebGL) + Gaussian Splatting        │   │
│  │  - COPC Point Cloud Rendering                       │   │
│  │  - Gaussian Splat Rendering (antimatter15/splat)   │   │
│  │  - Layer Fusion & Blending                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/reconstruction                                │   │
│  │  - POST /webodm (trigger WebODM job)               │   │
│  │  - POST /nerfstudio (trigger Nerfstudio training)   │   │
│  │  - POST /pix4d (trigger Pix4D job)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/benchmark                                     │   │
│  │  - POST /compare (compute metrics)                  │   │
│  │  - GET /report (generate report)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Reconstruction Pipeline (Backend)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WebODM (Docker)                                    │   │
│  │  - OpenSfM (SfM)                                    │   │
│  │  - OpenMVS (MVS)                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Nerfstudio (Python + PyTorch)                      │   │
│  │  - gsplat (Gaussian splatting)                      │   │
│  │  - nerfacto (NeRF)                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Pix4D (Cloud API)                                  │   │
│  │  - Pix4Dmatic (desktop) or Pix4Dcloud (cloud)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  IGN LiDAR HD (COPC)                                │   │
│  │  - Source: data.geopf.fr                            │   │
│  │  - Format: .copc.laz                                │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Reconstruction Outputs                             │   │
│  │  - Point clouds: .laz, .ply                        │   │
│  │  - Meshes: .obj, .ply                              │   │
│  │  - Gaussian splats: .splat, .ply                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Benchmarking Results                               │   │
│  │  - Metrics: JSON                                    │   │
│  │  - Reports: PDF, HTML                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Frontend (Next.js + React)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Map Library**: Mapbox GL JS (for AOI selection)
- **State Management**: Zustand or Redux Toolkit
- **UI Components**: Tailwind CSS + shadcn/ui (already in boilerplate)

#### 2. 3D Viewer (Potree + Gaussian Splatting)
- **Potree**: Modified version of Potree (potree.org) for COPC support
- **Gaussian Splatting Viewer**: antimatter15/splat (WebGL-based)
- **Integration**: Iframe communication between Potree and splatting viewer
- **Fusion**: Render both in same WebGL context (requires modification of Potree)

#### 3. Backend API (Next.js API Routes)
- **Reconstruction Endpoints**:
  - `POST /api/reconstruction/webodm` → Triggers WebODM job
  - `POST /api/reconstruction/nerfstudio` → Triggers Nerfstudio training
  - `POST /api/reconstruction/pix4d` → Triggers Pix4D job
- **Benchmarking Endpoints**:
  - `POST /api/benchmark/compare` → Computes metrics (RMSE, PSNR, SSIM)
  - `GET /api/benchmark/report` → Generates PDF/HTML report

#### 4. Reconstruction Pipeline (Backend Services)
- **WebODM**: Docker container running WebODM (opendronemap/webodm)
- **Nerfstudio**: Python environment with Nerfstudio + gsplat
- **Pix4D**: Cloud API (Pix4Dcloud) or desktop API (Pix4Dmatic)

#### 5. Data Storage
- **COPC Files**: IGN LiDAR HD (data.geopf.fr)
- **Reconstruction Outputs**: Local filesystem or S3-compatible storage
- **Benchmarking Results**: PostgreSQL (for metrics) + File system (for reports)

---

## Data Pipeline

### Pipeline 1: WebODM Reconstruction

```
Drone Imagery (JPEG/PNG)
        │
        ▼
┌───────────────────────┐
│  Preprocessing         │
│  - Undistortion        │
│  - Color correction    │
│  - Pose estimation     │
│  (OpenSfM / COLMAP)   │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  WebODM Reconstruction │
│  - Dense matching      │
│  - Point cloud gen.    │
│  - Mesh generation      │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Output               │
│  - dense_cloud.laz    │
│  - mesh.obj           │
│  - orthomosaic.tif    │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Potree Conversion     │
│  (laz to octree)      │
└───────────────────────┘
        │
        ▼
  Visualize in Browser
```

### Pipeline 2: Gaussian Splatting Reconstruction

```
Drone Imagery (JPEG/PNG)
        │
        ▼
┌───────────────────────┐
│  Preprocessing         │
│  - Undistortion        │
│  - Pose estimation     │
│  (COLMAP)              │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Nerfstudio Training   │
│  - gsplat model        │
│  - 100-1000 iterations │
│  - GPU required         │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Output               │
│  - point_cloud.ply    │
│  - renders/ (images)  │
│  - splat.ply          │
└───────────────────────┘
        │
        ├───────────────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│  Convert to  │    │  Visualize       │
│  Point Cloud │    │  (Gaussian       │
│  (3DGS-to-PC)│    │  Splatting Viewer│
└──────────────┘    └──────────────────┘
        │
        ▼
┌───────────────────────┐
│  Potree Conversion     │
│  (optional, for fusion)│
└───────────────────────┘
        │
        ▼
  Visualize in Browser
```

### Pipeline 3: Benchmarking

```
LiDAR Ground Truth (COPC)
        │
        ▼
┌───────────────────────┐
│  Preprocessing         │
│  - Downsampling        │
│  - Noise filtering     │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Reconstruction 1      │
│  (WebODM)              │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Reconstruction 2      │
│  (Nerfstudio)          │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Reconstruction 3      │
│  (Pix4D)               │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Compute Metrics       │
│  - RMSE (CloudCompare) │
│  - PSNR (image-based)  │
│  - SSIM (image-based)  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Generate Report       │
│  - Table of metrics    │
│  - Visual comparisons  │
│  - Cost analysis       │
└───────────────────────┘
```

---

## Benchmark Methodology

### Metrics

#### 1. Geometric Accuracy (Point Cloud Comparison)
- **RMSE (Root Mean Square Error)**:
  - Compare reconstruction point cloud against LiDAR ground truth
  - Use CloudCompare (ICP algorithm) for alignment
  - Formula: $RMSE = \sqrt{\frac{1}{N} \sum_{i=1}^{N} d_i^2}$
  - Where $d_i$ is the distance from reconstruction point $i$ to nearest ground truth point

- **Completeness**:
  - Percentage of ground truth points within distance threshold (e.g., 10cm)
  - Formula: $Completeness = \frac{N_{matched}}{N_{ground\_truth}} \times 100\%$

- **Accuracy**:
  - Percentage of reconstruction points within distance threshold
  - Formula: $Accuracy = \frac{N_{matched}}{N_{reconstruction}} \times 100\%$

#### 2. Image Quality (Rendering Comparison)
- **PSNR (Peak Signal-to-Noise Ratio)**:
  - Compare rendered images from reconstruction against original drone imagery
  - Formula: $PSNR = 10 \cdot \log_{10} \left( \frac{MAX^2}{MSE} \right)$
  - Higher is better (typical values: 20-40 dB)

- **SSIM (Structural Similarity Index)**:
  - Compare structural similarity between rendered and original images
  - Range: 0 to 1 (1 = identical)
  - Formula: $SSIM(x, y) = \frac{(2\mu_x\mu_y + C_1)(2\sigma_{xy} + C_2)}{(\mu_x^2 + \mu_y^2 + C_1)(\sigma_x^2 + \sigma_y^2 + C_2)}$

#### 3. Processing Time
- **Total processing time** (from imagery to final reconstruction)
- **Breakdown**: SfM time, MVS time, mesh generation time, training time (for NeRF/3DGS)

#### 4. Cost
- **Compute cost** (cloud instances for WebODM/Nerfstudio)
- **Software cost** (Pix4D license: ~€3,000/year)
- **Storage cost** (for reconstruction outputs)

### Benchmarking Procedure

1. **Select AOI**:
   - Choose 5 test sites with varying characteristics:
     - Urban (dense buildings): Châtelet-les-Halles, Paris
     - Suburban (sparse buildings + vegetation): Bordeaux
     - Rural (vegetation): Forest near Lyon
     - Industrial (flat terrain + structures): Marseille port
     - Complex (elevation changes): Lyon hills

2. **Collect Data**:
   - Download corresponding LiDAR HD tile (COPC)
   - Collect drone imagery (YouTube, Google Earth, or proprietary)
   - Ensure overlapping coverage between LiDAR and imagery

3. **Run Reconstrutions**:
   - Run WebODM, Nerfstudio, and Pix4D on same imagery
   - Use same parameters where possible (e.g., same quality preset)

4. **Compute Metrics**:
   - Run CloudCompare for geometric accuracy (RMSE)
   - Render novel views from each reconstruction and compute PSNR/SSIM
   - Record processing time and cost

5. **Generate Report**:
   - Table comparing metrics across methods
   - Visual comparison (side-by-side screenshots)
   - Cost analysis (ROI of custom pipeline vs. Pix4D)

### Expected Results (Hypotheses)

| Metric | WebODM | Nerfstudio (gsplat) | Pix4D | LiDAR HD (Ground Truth) |
|--------|--------|----------------------|-------|--------------------------|
| RMSE (cm) | 10-20 | 5-15 | 8-18 | 0 (reference) |
| Completeness (%) | 80-90 | 70-85 | 85-95 | 100 |
| PSNR (dB) | 25-30 | 30-35 | 28-33 | N/A |
| SSIM | 0.7-0.8 | 0.8-0.9 | 0.75-0.85 | N/A |
| Processing Time (min) | 30-60 | 60-120 | 20-40 | N/A |
| Cost (€) | 0 (open-source) | 10-50 (compute) | 3000/year (license) | N/A |

**Hypotheses**:
- Nerfstudio (gsplat) will have highest PSNR/SSIM (photorealistic rendering)
- Pix4D will have highest completeness (commercial optimization)
- WebODM will be slowest but most cost-effective
- LiDAR HD will have highest geometric accuracy (ground truth)

---

## UI/UX Specifications

### 1. Main Viewer Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Logo + Project Name + User Menu                         │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │                        │  │                                │ │
│  │    Map (Left Panel)    │  │    3D Viewer (Main Area)       │ │
│  │                        │  │                                │ │
│  │  - AOI Selection       │  │  - Potree (COPC)               │ │
│  │  - Tile Boundaries     │  │  - Gaussian Splatting          │ │
│  │  - Layer Toggle        │  │  - Fusion View                 │ │
│  │                        │  │                                │ │
│  └────────────────────────┘  └────────────────────────────────┘ │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │  Layer Control (Left)  │  │  Toolbar (Top of Viewer)       │ │
│  │                        │  │                                │ │
│  │  ☑ LiDAR HD           │  │  [📏 Measure] [📷 Screenshot]  │ │
│  │  ☑ Gaussian Splats    │  │  [🔍 Zoom to Fit] [⚙ Settings] │ │
│  │  ☐ Mesh               │  │                                │ │
│  │  ☐ Error Map          │  └────────────────────────────────┘ │
│  │                        │                                     │
│  │  Opacity: [=========] │                                     │
│  │  Color By: [Height ▼]│                                     │
│  └────────────────────────┘                                     │
├──────────────────────────────────────────────────────────────────┤
│  Footer: Status Bar + Metrics Summary                           │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Layer Control Panel

**Location**: Left sidebar (collapsible)

**Components**:
- **Layer List**:
  - Checkbox for each layer (LiDAR HD, Gaussian Splats, Mesh, Error Map)
  - Drag-and-drop to reorder layers
- **Opacity Slider**: Per-layer opacity control (0-100%)
- **Color Mapping**: Dropdown to select color mapping (Height, Intensity, Error, RGB)
- **Point Size**: Slider for point size (for point cloud layers)
- **Remove Layer**: Button to remove layer

**Interactions**:
- Click checkbox → Toggle layer visibility
- Drag slider → Update layer opacity in real-time
- Select color mapping → Update layer coloring

### 3. Benchmarking Dashboard

**Location**: Separate page (`/benchmark`)

**Components**:
- **Metric Cards**:
  - RMSE: `12.3 cm` (with color coding: green <10cm, yellow 10-20cm, red >20cm)
  - PSNR: `32.1 dB`
  - SSIM: `0.87`
  - Processing Time: `45 min`
  - Cost: `€12.50`

- **Comparison Table**:

| Metric | WebODM | Nerfstudio | Pix4D | Winner |
|--------|--------|------------|-------|--------|
| RMSE (cm) | 15.2 | 8.7 | 10.3 | Nerfstudio |
| PSNR (dB) | 28.5 | 33.2 | 30.1 | Nerfstudio |
| SSIM | 0.78 | 0.89 | 0.82 | Nerfstudio |
| Time (min) | 55 | 90 | 35 | Pix4D |
| Cost (€) | 0 | 15 | 0* | WebODM |

\* Pix4D cost is 0 for this run (amortized license cost)

- **Visual Comparison**:
  - Side-by-side viewer (3 columns: WebODM, Nerfstudio, Pix4D)
  - Synchronized camera (orbit one → all update)

- **Export Report**:
  - Button: "Export PDF"
  - Button: "Export HTML"
  - Button: "Export CSV (raw data)"

### 4. Reconstruction Wizard

**Location**: Modal dialog (triggered from "New Reconstruction" button)

**Steps**:
1. **Select Imagery**:
   - Drag-and-drop upload
   - Or select from previous uploads
   - Show thumbnail preview

2. **Select Pipeline**:
   - Radio buttons: WebODM, Nerfstudio, Pix4D
   - Show estimated processing time and cost

3. **Configure Parameters**:
   - WebODM: Quality (Low, Medium, High), Algorithm (PMVS, OpenMVS)
   - Nerfstudio: Model (gsplat, nerfacto), Iterations (100-10000)
   - Pix4D: Preset (Rapid, Standard, Accurate)

4. **Review & Submit**:
   - Summary of inputs
   - Button: "Start Reconstruction"

**Progress Indicator**:
- Show progress bar during processing
- Show logs (stdout/stderr from reconstruction pipeline)
- Notify on completion (browser notification + email)

---

## Implementation Roadmap

### Phase 1: MVP (Minimum Viable Product) - 2 Months

**Goal**: Basic functionality for visualizing COPC + Gaussian splats

**Tasks**:
1. **Week 1-2**: Set up Next.js project with Potree integration
   - Modify `ign-ept-viewer.html` to support COPC (already done)
   - Add layer control panel UI

2. **Week 3-4**: Integrate Gaussian splatting viewer
   - Fork antimatter15/splat and modify for our use case
   - Add support for .ply (3DGS format)
   - Implement camera synchronization with Potree

3. **Week 5-6**: Implement layer fusion
   - Render both Potree and Gaussian splatting in same WebGL context
   - Add opacity control for each layer
   - Test with sample data (Paris, Lyon)

4. **Week 7-8**: Deploy MVP and gather feedback
   - Deploy to Vercel (frontend) and Railway (backend)
   - Test with Raphe UAV team
   - Iterate based on feedback

**Deliverables**:
- Working web viewer with COPC + Gaussian splatting fusion
- Basic layer control panel
- Documentation for deployment

---

### Phase 2: Reconstruction Pipeline Integration - 2 Months

**Goal**: Integrate WebODM and Nerfstudio pipelines

**Tasks**:
1. **Week 1-2**: Set up WebODM integration
   - Deploy WebODM in Docker
   - Create API route (`/api/reconstruction/webodm`)
   - Test with sample imagery

2. **Week 3-4**: Set up Nerfstudio integration
   - Set up Python environment with Nerfstudio + gsplat
   - Create API route (`/api/reconstruction/nerfstudio`)
   - Test with sample imagery

3. **Week 5-6**: Implement reconstruction wizard UI
   - Create modal dialog for new reconstruction
   - Add progress indicator
   - Add notification system (email + browser)

4. **Week 7-8**: Testing and optimization
   - Test end-to-end pipeline (upload → reconstruct → visualize)
   - Optimize for large datasets (1000+ images)
   - Document API endpoints

**Deliverables**:
- Working reconstruction pipeline (WebODM + Nerfstudio)
- Reconstruction wizard UI
- API documentation

---

### Phase 3: Benchmarking & Comparison - 1.5 Months

**Goal**: Implement benchmarking framework

**Tasks**:
1. **Week 1-2**: Implement metric computation
   - Integrate CloudCompare for RMSE computation
   - Implement PSNR/SSIM computation (Python script)
   - Create API route (`/api/benchmark/compare`)

2. **Week 3-4**: Create benchmarking dashboard UI
   - Create `/benchmark` page
   - Add metric cards and comparison table
   - Add visual comparison viewer

3. **Week 5-6**: Test with real data
   - Collect data from 5 test sites
   - Run all pipelines (WebODM, Nerfstudio, Pix4D)
   - Generate benchmarking report

**Deliverables**:
- Benchmarking dashboard
- Automated report generation (PDF + HTML)
- Case study with real data

---

### Phase 4: Pix4D Integration & Advanced Features - 1.5 Months

**Goal**: Integrate Pix4D and add advanced features

**Tasks**:
1. **Week 1-2**: Integrate Pix4D API
   - Set up Pix4Dcloud account
   - Create API route (`/api/reconstruction/pix4d`)
   - Test with sample imagery

2. **Week 3-4**: Implement advanced visualization features
   - Add measurement tools (distance, area, volume)
   - Add error map visualization
   - Add export functionality (OBJ, LAZ, PLY)

3. **Week 5-6**: Optimization and polish
   - Optimize rendering performance (level-of-detail, occlusion culling)
   - Add keyboard shortcuts
   - Improve UI/UX based on user feedback

**Deliverables**:
- Pix4D integration
- Measurement tools
- Export functionality
- Performance optimizations

---

### Phase 5: Deployment & Documentation - 1 Month

**Goal**: Production-ready deployment

**Tasks**:
1. **Week 1-2**: Set up production infrastructure
   - Deploy to cloud provider (AWS/GCP)
   - Set up CI/CD pipeline (GitHub Actions)
   - Configure monitoring (Sentry, LogRocket)

2. **Week 3-4**: Write documentation
   - User manual (how to use the viewer)
   - API documentation (for developers)
   - Deployment guide (for DevOps)
   - Case study (Raphe use case)

**Deliverables**:
- Production deployment
- Complete documentation
- Case study publication

---

## Appendices

### Appendix A: Software Stack Details

#### 1. WebODM
- **Website**: https://www.opendronemap.org
- **License**: GPLv3 (open-source)
- **Components**:
  - OpenSfM: Structure-from-Motion (SfM)
  - OpenMVS: Multi-View Stereo (MVS)
  - GRASS GIS: Orthomosaic generation
- **API**: REST API (Docker container)
- **Output Formats**: LAZ (point cloud), OBJ (mesh), TIF (orthomosaic)

#### 2. Nerfstudio (gsplat)
- **Website**: https://nerfstudio-project.github.io/
- **License**: Apache 2.0 (open-source)
- **Components**:
  - gsplat: Gaussian splatting implementation
  - nerfacto: NeRF implementation
  - instant-ngp: Fast NeRF implementation
- **Installation**: `pip install nerfstudio`
- **Output Formats**: PLY (point cloud + Gaussian splats), PNG (renders)

#### 3. Pix4D
- **Website**: https://www.pix4d.com
- **License**: Proprietary (subscription-based)
- **Products**:
  - Pix4Dmapper: Desktop photogrammetry
  - Pix4Dmatic: Large-scale photogrammetry
  - Pix4Dcloud: Cloud-based processing
- **API**: REST API (Pix4Dcloud) / Python API (Pix4Dmapper)
- **Output Formats**: LAZ, OBJ, TIF, PDF (report)

#### 4. Potree
- **Website**: https://potree.org
- **License**: BSD 2-Clause (open-source)
- **Features**:
  - Octree-based point cloud streaming
  - Support for LAZ, LAS, BIN, CSV
  - Measurement tools
  - Elevation profile
- **Modifications Needed**:
  - Add COPC support (already done in `ign-ept-viewer.html`)
  - Add Gaussian splatting support (new feature)

#### 5. Gaussian Splatting Viewer (antimatter15/splat)
- **Website**: https://github.com/antimatter15/splat
- **License**: MIT (open-source)
- **Features**:
  - WebGL-based rendering
  - Support for .splat and .ply (3DGS format)
  - Real-time rendering (60+ FPS)
- **Modifications Needed**:
  - Add camera synchronization with Potree
  - Add support for large scenes (octree-based streaming)

---

### Appendix B: Data Sources

#### 1. IGN LiDAR HD (COPC)
- **Website**: https://data.geopf.fr
- **WFS Endpoint**: `https://data.geopf.fr/wfs/ows`
- **Layer**: `IGNF_NUAGES-DE-POINTS-LIDAR-HD:dalle`
- **Coverage**: France (mainland + Corsica)
- **Resolution**: 5-20 points/m²
- **Update Frequency**: Annual
- **License**: Open License (free for commercial use)

#### 2. YouTube (Drone Footage)
- **Example**: Châtelet-les-Halles, Paris
- **URL**: https://www.youtube.com/watch?v=jRbCWEz8uhU
- **Download Tool**: `yt-dlp` (command-line tool)
- **Legal Note**: Check copyright before using for commercial purposes

#### 3. Google Earth (3D Tiles)
- **Website**: https://earth.google.com
- **Extraction Method**: RenderDoc + Blender pipeline
- **Steps**:
  1. Install RenderDoc and Blender
  2. Install Maps Models Importer plugin (Blender)
  3. Launch Chrome with `--disable-gpu-sandbox --gpu-startup-dialog`
  4. Capture frame in RenderDoc
  5. Import .rdc file into Blender
- **Legal Note**: Strictly non-commercial (violates Google Earth ToS)

---

### Appendix C: API Endpoints (Draft)

#### 1. Reconstruction Endpoints

**POST** `/api/reconstruction/webodm`
```json
Request:
{
  "images": ["https://storage.example.com/images/img1.jpg", ...],
  "params": {
    "quality": "high",
    "algorithm": "openmvs"
  }
}

Response:
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "queued",
  "estimatedTime": "45 minutes"
}
```

**POST** `/api/reconstruction/nerfstudio`
```json
Request:
{
  "images": ["https://storage.example.com/images/img1.jpg", ...],
  "params": {
    "model": "gsplat",
    "iterations": 1000
  }
}

Response:
{
  "jobId": "123e4567-e89b-12d3-a456-426614174001",
  "status": "queued",
  "estimatedTime": "90 minutes"
}
```

**GET** `/api/reconstruction/:jobId`
```json
Response:
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "outputs": {
    "pointCloud": "https://storage.example.com/outputs/dense_cloud.laz",
    "mesh": "https://storage.example.com/outputs/mesh.obj"
  }
}
```

#### 2. Benchmarking Endpoints

**POST** `/api/benchmark/compare`
```json
Request:
{
  "groundTruth": "https://storage.example.com/lidar/paris_tile.laz",
  "reconstructions": [
    {
      "name": "WebODM",
      "url": "https://storage.example.com/outputs/webodm/dense_cloud.laz"
    },
    {
      "name": "Nerfstudio",
      "url": "https://storage.example.com/outputs/nerfstudio/point_cloud.ply"
    }
  ]
}

Response:
{
  "benchmarkId": "123e4567-e89b-12d3-a456-426614174002",
  "status": "processing",
  "metrics": null
}
```

**GET** `/api/benchmark/:benchmarkId`
```json
Response:
{
  "benchmarkId": "123e4567-e89b-12d3-a456-426614174002",
  "status": "completed",
  "metrics": {
    "WebODM": {
      "rmse": 15.2,
      "completeness": 0.87,
      "psnr": 28.5,
      "ssim": 0.78
    },
    "Nerfstudio": {
      "rmse": 8.7,
      "completeness": 0.82,
      "psnr": 33.2,
      "ssim": 0.89
    }
  }
}
```

---

### Appendix D: Testing Strategy

#### 1. Unit Tests
- **Framework**: Vitest (already in boilerplate)
- **Coverage**:
  - API routes (`/api/reconstruction/*`, `/api/benchmark/*`)
  - Utility functions (coordinate conversion, file parsing)
- **Target Coverage**: 80%

#### 2. Integration Tests
- **Framework**: Playwright (already in boilerplate)
- **Scenarios**:
  - Upload imagery → Trigger reconstruction → Visualize result
  - Compare two reconstructions → Generate report
- **Target**: 10 critical paths

#### 3. End-to-End Tests
- **Framework**: Playwright
- **Scenarios**:
  - User workflow: Select AOI → Download COPC → Upload imagery → Run reconstruction → Visualize
  - Benchmarking workflow: Select reconstructions → Compute metrics → Export report
- **Target**: 5 user journeys

#### 4. Performance Tests
- **Tool**: Custom script (Node.js)
- **Metrics**:
  - Time to first byte (TTFB) for COPC streaming
  - Frame rate (FPS) for Potree + Gaussian splatting
  - API response time for reconstruction jobs
- **Target**:
  - TTFB < 500ms
  - FPS > 60 (for <100M points)
  - API response < 2s

---

### Appendix E: Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Potree + Gaussian splatting integration is technically challenging | High | Medium | Allocate extra time for R&D; consider alternative (render side-by-side) |
| Nerfstudio training requires expensive GPU | Medium | High | Use cloud GPU (AWS G4dn); optimize training (fewer iterations) |
| Pix4D API is not well-documented | Medium | Medium | Use Pix4Dcloud (better docs); contact Pix4D support |
| Legal issues with YouTube/Google Earth data | High | Low | Use only open datasets (IGN, OpenStreetMap); get permission for YouTube videos |
| Performance issues with large datasets | High | Medium | Implement level-of-detail; use WebGL occlusion culling |

---

### Appendix F: Glossary

- **3DGS**: 3D Gaussian Splatting
- **AOI**: Area of Interest
- **COPC**: Cloud Optimized Point Cloud
- **LAZ**: Compressed LAS (point cloud format)
- **MVS**: Multi-View Stereo
- **NeRF**: Neural Radiance Fields
- **PSNR**: Peak Signal-to-Noise Ratio
- **RMSE**: Root Mean Square Error
- **SfM**: Structure-from-Motion
- **SSIM**: Structural Similarity Index
- **WFS**: Web Feature Service

---

## Conclusion

This specification defines a comprehensive 3D reconstruction fusion browser that addresses Raphe's need for enhanced mapping capabilities. By combining COPC point clouds with Gaussian splatting reconstructions, the system will provide:

1. **Better reconstruction quality** through neural rendering
2. **Scalability** through octree-based streaming
3. **Flexibility** through support for multiple reconstruction pipelines
4. **Benchmarking** through quantitative comparison framework

The implementation roadmap spans 7 months and delivers incremental value, starting with an MVP and culminating in a production-ready system.

**Next Steps**:
1. Review and approve this specification
2. Set up project infrastructure (GitHub repo, cloud accounts)
3. Begin Phase 1 (MVP development)

---

**Document History**:
- v1.0 (2025-01): Initial draft
