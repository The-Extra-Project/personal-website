#!/usr/bin/env python3
"""Derive a per-scene world->viewer transform from each recon's seed camera.

Why this exists
---------------
The Lyra/VIPE reconstructions are **gauge-free**: every clip recovers its own
world frame, so there is no shared convention for "up" or "forward". The first
attempt at publishing them hardcoded `-r 180,0,0` (a COLMAP y-down fix) plus the
seed heading, which happened to be right for one scene and wrong for the rest —
one cloud ended up behind the camera (a black frame), another upside-down.

The recon does record the truth: `cameras.npz` carries `w2c_render` (world->camera)
for every frame, so frame 0 tells us exactly where the seed camera sat and which
way it pointed *in that reconstruction's own frame*. From that we build the
rotation that puts the camera at the origin looking down -Z with +Y up (the
three.js / Spark convention), plus the translation that brings the camera to the
origin. The viewer applies it to the mesh, so every scene frames identically.

The ETL rotates the Gaussians by `R_etl = Ry(yaw) @ Rx(180)`, so the camera pose
is rotated by the same R_etl before the transform is built.

Usage:
    python3 scripts/etl/seed_camera_transform.py --npz-dir /tmp/a2/cams
    python3 scripts/etl/seed_camera_transform.py --npz-dir /tmp/a2/cams --all
"""

from __future__ import annotations

import ast
import argparse
import json
import math
import pathlib
import re
import struct
import sys
import zipfile

REPO = pathlib.Path(__file__).resolve().parents[2]
REPORT = REPO / "public" / "drone" / "lyra" / "sog-report.json"

# scene id -> (npz stem, yaw). yaw must match scripts/vps/lyra_to_sog.py WORLDS.
SCENES = {
    "roche-tortue": ("roche-tortue", -35.0),
    "trail-ascent": ("trail-ascent", 20.0),
    "croix-lorraine": ("croix-lorraine", 180.0),
    "pano-06d14b03": ("pano_06d14b03-a46a-450b-", 0.0),
    "pano-175106e9": ("pano_175106e9-08a9-4be9-", 0.0),
}


# ---------------------------------------------------------------- npz (stdlib)

def read_npy(buf: bytes) -> tuple[tuple[int, ...], str, tuple]:
    """Parse a .npy payload without numpy. Returns (shape, descr, flat values)."""
    if buf[:6] != b"\x93NUMPY":
        raise ValueError("not a .npy payload")
    hlen = struct.unpack("<H", buf[8:10])[0]
    hdr = buf[10:10 + hlen].decode("latin1")
    body = buf[10 + hlen:]
    shape = tuple(
        int(x) for x in re.search(r"'shape':\s*\(([^)]*)\)", hdr).group(1).split(",") if x.strip()
    )
    descr = re.search(r"'descr':\s*'([^']+)'", hdr).group(1)
    fmt = {"f8": "<d", "f4": "<f", "i8": "<q", "i4": "<i", "u1": "B", "b1": "?"}.get(descr[1:], "<f")
    count = 1
    for s in shape:
        count *= s
    return shape, descr, struct.unpack_from(f"<{count}{fmt[1:]}", body, 0)


def load_npz(path: pathlib.Path) -> dict[str, tuple[tuple[int, ...], tuple]]:
    out = {}
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            if name.endswith(".npy"):
                shape, _, vals = read_npy(z.read(name))
                out[name[:-4]] = (shape, vals)
    return out


# ------------------------------------------------------------------- 3x3 maths

def mat3(rows: list[list[float]]) -> list[list[float]]:
    return [list(r) for r in rows]


def mul3(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def mul_vec3(m, v):
    return [sum(m[i][k] * v[k] for k in range(3)) for i in range(3)]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def norm(v):
    n = math.sqrt(sum(x * x for x in v))
    return [x / n for x in v] if n > 1e-12 else [0.0, 0.0, 0.0]


def rot_x180():
    return [[1, 0, 0], [0, -1, 0], [0, 0, -1]]


def rot_y(deg):
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]


def transpose(m):
    return [[m[j][i] for j in range(3)] for i in range(3)]


def build_transform(cam_world_pos, forward, up):
    """Rotation mapping (forward -> -Z, up -> +Y) plus the translation that puts
    the camera at the origin. Rows of M are [right; up; -forward]."""
    f = norm(forward)
    u = norm(up)
    # re-orthogonalise: u -= (u.f) f
    d = sum(u[i] * f[i] for i in range(3))
    u = norm([u[i] - d * f[i] for i in range(3)])
    right = norm(cross(f, u))
    u = cross(right, f)
    M = [right, u, [-f[0], -f[1], -f[2]]]
    t = [-sum(M[i][k] * cam_world_pos[k] for k in range(3)) for i in range(3)]
    return M, t


def to_quaternion(M):
    """3x3 rotation -> (x, y, z, w), the order THREE.Quaternion.set takes."""
    m = M
    tr = m[0][0] + m[1][1] + m[2][2]
    if tr > 0:
        s = math.sqrt(tr + 1.0) * 2
        w = 0.25 * s
        x = (m[2][1] - m[1][2]) / s
        y = (m[0][2] - m[2][0]) / s
        z = (m[1][0] - m[0][1]) / s
    elif m[0][0] > m[1][1] and m[0][0] > m[2][2]:
        s = math.sqrt(1.0 + m[0][0] - m[1][1] - m[2][2]) * 2
        w = (m[2][1] - m[1][2]) / s
        x = 0.25 * s
        y = (m[0][1] + m[1][0]) / s
        z = (m[0][2] + m[2][0]) / s
    elif m[1][1] > m[2][2]:
        s = math.sqrt(1.0 + m[1][1] - m[0][0] - m[2][2]) * 2
        w = (m[0][2] - m[2][0]) / s
        x = (m[0][1] + m[1][0]) / s
        y = 0.25 * s
        z = (m[1][2] + m[2][1]) / s
    else:
        s = math.sqrt(1.0 + m[2][2] - m[0][0] - m[1][1]) * 2
        w = (m[1][0] - m[0][1]) / s
        x = (m[0][2] + m[2][0]) / s
        y = (m[1][2] + m[2][1]) / s
        z = 0.25 * s
    return [round(x, 6), round(y, 6), round(z, 6), round(w, 6)]


def pose_from_npz(npz: pathlib.Path, yaw: float) -> dict:
    d = load_npz(npz)
    shape, vals = d["w2c_render"]
    # first frame, row-major 4x4
    m = [vals[0:4], vals[4:8], vals[8:12], vals[12:16]]
    R = [[m[r][c] for c in range(3)] for r in range(3)]
    t = [m[r][3] for r in range(3)]
    Rt = transpose(R)
    C_raw = [-sum(Rt[i][k] * t[k] for k in range(3)) for i in range(3)]
    f_raw = mul_vec3(Rt, [0.0, 0.0, 1.0])   # camera looks along +z in its own frame
    u_raw = mul_vec3(Rt, [0.0, -1.0, 0.0])  # camera y points down

    R_etl = mul3(rot_y(yaw), rot_x180())    # what the ETL applied to the Gaussians
    C = mul_vec3(R_etl, C_raw)
    f = mul_vec3(R_etl, f_raw)
    u = mul_vec3(R_etl, u_raw)
    M, tt = build_transform(C, f, u)
    return {
        "camera_transform": {
            "translation": [round(v, 4) for v in tt],
            "quaternion": to_quaternion(M),
        },
        "seed_camera_raw": {"position": [round(v, 4) for v in C_raw], "forward": [round(v, 4) for v in f_raw]},
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--npz-dir", type=pathlib.Path, required=True)
    ap.add_argument("--only", default=None)
    args = ap.parse_args()

    report = json.loads(REPORT.read_text())
    by_id = {s["id"]: s for s in report["scenes"]}

    for sid, (stem, yaw) in SCENES.items():
        if args.only and sid != args.only:
            continue
        npz = args.npz_dir / f"{stem}.npz"
        if not npz.exists():
            print(f"  {sid}: npz missing ({npz.name}) — skipped")
            continue
        rec = pose_from_npz(npz, yaw)
        if sid not in by_id:
            print(f"  {sid}: not in report — skipped")
            continue
        # the viewer now owns orientation, so the camera sits at the origin
        by_id[sid].update(rec)
        by_id[sid]["cameraOrigin"] = None  # retired fallback
        by_id[sid]["camera_origin"] = [0.0, 0.0, 0.0]
        by_id[sid]["camera_forward"] = [0.0, 0.0, -1.0]
        c = rec["camera_transform"]
        print(f"  {sid}: t={c['translation']} q={c['quaternion']}")

    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(f"\n[report] {REPORT.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
