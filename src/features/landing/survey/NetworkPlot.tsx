'use client';

// src/features/landing/survey/NetworkPlot.tsx
//
// The control network, drawn as a geodetic network diagram.
//
// The layout is schematic — a triangulation diagram is drawn for legibility,
// not to scale, and the real coordinates live in the station record beside it.
// Baselines carry their length, vertices carry the angle observed between the
// two sights, and stations that have moved in the current epoch state their
// delta in signal colour.

import { useMemo } from 'react';

import type { Station } from './stations';

type Node = {
  id: string;
  x: number;
  y: number;
  /** Label anchor, nudged so station names never sit under a baseline. */
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
};

const NODES: Node[] = [
  { id: 'STN 03', x: 108, y: 104, labelX: 108, labelY: 74, anchor: 'middle' },
  { id: 'STN 06', x: 372, y: 66, labelX: 372, labelY: 38, anchor: 'middle' },
  { id: 'STN 02', x: 618, y: 176, labelX: 618, labelY: 148, anchor: 'middle' },
  { id: 'STN 01', x: 306, y: 236, labelX: 306, labelY: 262, anchor: 'middle' },
  { id: 'STN 04', x: 150, y: 330, labelX: 150, labelY: 360, anchor: 'middle' },
  { id: 'STN 05', x: 474, y: 348, labelX: 474, labelY: 378, anchor: 'middle' },
];

const BASELINES: [string, string][] = [
  ['STN 03', 'STN 06'],
  ['STN 06', 'STN 02'],
  ['STN 03', 'STN 01'],
  ['STN 06', 'STN 01'],
  ['STN 02', 'STN 01'],
  ['STN 01', 'STN 04'],
  ['STN 01', 'STN 05'],
  ['STN 04', 'STN 05'],
  ['STN 03', 'STN 04'],
];

/** Sights drawn dashed: observed but not forming a triangle side. */
const SIGHTS: [string, string][] = [
  ['STN 02', 'STN 05'],
  ['STN 06', 'STN 04'],
];

/** Angle stations: vertex, and the two sights the arc spans. */
const ARCS: { at: string; from: string; to: string; r: number; label: string }[] = [
  { at: 'STN 01', from: 'STN 06', to: 'STN 03', r: 34, label: `118°42'10"` },
  { at: 'STN 06', from: 'STN 02', to: 'STN 01', r: 30, label: `64°07'55"` },
  { at: 'STN 04', from: 'STN 01', to: 'STN 05', r: 32, label: `97°31'20"` },
];

const byId = new Map(NODES.map(n => [n.id, n]));
const deltaOf = (stations: Station[], id: string) => stations.find(s => s.id === id);

function lengthLabel(a: Node, b: Node, stations: Station[]) {
  // Illustrative baseline length derived from the plotted span, in metres.
  const px = Math.hypot(b.x - a.x, b.y - a.y);
  const metres = (px / 6.4).toFixed(1);
  const moved
    = Math.abs(deltaOf(stations, a.id)?.delta ?? 0) > 0.02
      || Math.abs(deltaOf(stations, b.id)?.delta ?? 0) > 0.02;
  return { metres, moved };
}

export function NetworkPlot({
  stations,
  activeId,
  onSelect,
}: {
  stations: Station[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const baselines = useMemo(
    () =>
      BASELINES.map(([a, b]) => {
        const na = byId.get(a)!;
        const nb = byId.get(b)!;
        return { a: na, b: nb, ...lengthLabel(na, nb, stations) };
      }),
    [stations],
  );

  return (
    <svg
      className="sv-plot"
      viewBox="0 0 720 430"
      role="img"
      aria-label="Diagram of the control network: six stations joined by measured baselines"
    >
      {/* graticule inside the plot, finer than the page's */}
      <defs>
        <pattern id="sv-fine" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgba(150,183,209,0.07)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="720" height="430" fill="url(#sv-fine)" />

      {/* sights */}
      {SIGHTS.map(([a, b]) => {
        const na = byId.get(a)!;
        const nb = byId.get(b)!;
        return (
          <line key={`sight-${a}-${b}`} className="sight" x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} />
        );
      })}

      {/* baselines */}
      {baselines.map(({ a, b }) => (
        <line
          key={`base-${a.id}-${b.id}`}
          className="baseline"
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
        />
      ))}

      {/* baseline lengths, on a subset so the sheet stays readable */}
      {baselines
        .filter((_, i) => i % 2 === 0)
        .map(({ a, b, metres, moved }) => (
          <text
            key={`len-${a.id}-${b.id}`}
            className={moved ? 'stn-delta' : undefined}
            x={(a.x + b.x) / 2}
            y={(a.y + b.y) / 2 - 5}
            textAnchor="middle"
          >
            {metres}
            {' m'}
          </text>
        ))}

      {/* observed angles */}
      {ARCS.map(({ at, from, to, r, label }) => {
        const v = byId.get(at)!;
        const f = byId.get(from)!;
        const t = byId.get(to)!;

        const path = arcPath(v, f, t, r);
        const mid = ((Math.atan2(f.y - v.y, f.x - v.x) + Math.atan2(t.y - v.y, t.x - v.x)) / 2);
        return (
          <g key={`arc-${at}-${from}-${to}`}>
            <path className="arc" d={path} />
            <text
              x={v.x + Math.cos(mid) * (r + 22)}
              y={v.y + Math.sin(mid) * (r + 22) + 3}
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* stations */}
      {NODES.map((n) => {
        const s = deltaOf(stations, n.id);
        const active = n.id === activeId;
        const moved = Math.abs(s?.delta ?? 0) > 0.02;
        // Stack the delta on the far side of the name so the two never collide,
        // and neither lands on a baseline or an angle arc.
        const above = n.labelY < n.y;
        const deltaY = above ? n.labelY - 12 : n.labelY + 13;

        return (
          <g key={n.id} className="stn-hit" onClick={() => onSelect(n.id)}>
            <title>
              {n.id}
              {' — '}
              {s?.name}
            </title>
            {/* generous invisible hit target */}
            <circle cx={n.x} cy={n.y} r="18" fill="transparent" />
            <circle className={active ? 'mark mark-active' : 'mark'} cx={n.x} cy={n.y} r={active ? 6 : 4.5} />
            {active ? <circle className="arc" cx={n.x} cy={n.y} r="12" /> : null}
            <text
              className={active ? 'stn-name stn-name-active' : 'stn-name'}
              x={n.labelX}
              y={n.labelY}
              textAnchor={n.anchor}
            >
              {n.id}
            </text>
            {moved
              ? (
                  <text className="stn-delta" x={n.labelX} y={deltaY} textAnchor={n.anchor}>
                    Δ
                    {' '}
                    {s!.delta > 0 ? '+' : '−'}
                    {Math.abs(s!.delta).toFixed(3)}
                    {' m'}
                  </text>
                )
              : null}
          </g>
        );
      })}

      {/* scale bar and orientation */}
      <g transform="translate(26 388)">
        <line x1="0" y1="0" x2="132" y2="0" stroke="var(--ink-dim)" strokeWidth="1" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--ink-dim)" strokeWidth="1" />
        <line x1="66" y1="-3" x2="66" y2="3" stroke="var(--ink-dim)" strokeWidth="1" />
        <line x1="132" y1="-4" x2="132" y2="4" stroke="var(--ink-dim)" strokeWidth="1" />
        <text x="0" y="17">0</text>
        <text x="66" y="17" textAnchor="middle">150</text>
        <text x="132" y="17" textAnchor="end">300 m</text>
      </g>
      <g transform="translate(676 40)">
        <line x1="0" y1="18" x2="0" y2="-8" stroke="var(--ink-dim)" strokeWidth="1" />
        <path d="M0 -14 L4 -4 L0 -7 L-4 -4 Z" fill="var(--ink-dim)" />
        <text x="0" y="32" textAnchor="middle">N</text>
      </g>
    </svg>
  );
}

/** An arc between two sights at a vertex. */
function arcPath(v: Node, from: Node, to: Node, r: number) {
  const a1 = Math.atan2(from.y - v.y, from.x - v.x);
  const a2 = Math.atan2(to.y - v.y, to.x - v.x);
  let d = a2 - a1;
  while (d <= -Math.PI) {
    d += Math.PI * 2;
  }
  while (d > Math.PI) {
    d -= Math.PI * 2;
  }
  const sweep = d > 0 ? 1 : 0;
  const x1 = v.x + Math.cos(a1) * r;
  const y1 = v.y + Math.sin(a1) * r;
  const x2 = v.x + Math.cos(a2) * r;
  const y2 = v.y + Math.sin(a2) * r;
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}
