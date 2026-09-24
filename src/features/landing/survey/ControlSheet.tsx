'use client';

// src/features/landing/survey/ControlSheet.tsx
//
// The page's first viewport: the control network and the station record for
// whichever station is selected, observed in one of three epochs.
//
// The signature interaction is the epoch control. Pulling it does not navigate:
// every station on the plot re-reads its delta, the moved baselines restate
// their length, and the coordinate rail re-stamps. One control, total change of
// state.

import { useState } from 'react';

import { NetworkPlot } from './NetworkPlot';
import { EPOCHS, type Station, STATIONS, SYNTHETIC_NOTE } from './stations';

/** Deltas accumulate across the survey history; epoch 0 is the first observation. */
const EPOCH_FACTOR = [0, 0.45, 1];

export function ControlSheet() {
  const [epochIndex, setEpochIndex] = useState(EPOCHS.length - 1);
  const [activeId, setActiveId] = useState('STN 02');

  const factor = EPOCH_FACTOR[epochIndex] ?? 1;
  const epoch = EPOCHS[epochIndex]!;

  const stations: Station[] = STATIONS.map(s => ({
    ...s,
    delta: Number((s.delta * factor).toFixed(4)),
  }));

  const active = stations.find(s => s.id === activeId) ?? stations[1]!;
  const moved = Math.abs(active.delta) > 0.02;

  return (
    <>
      <section className="sv-shell sv-hero">
        <div className="sv-record">
          <div className="sv-record-head">
            <StationSigil />
            <span className="sv-status">
              <i aria-hidden />
              observed
            </span>
            <span className="sv-mono sv-stamp">{epoch.stamp}</span>
          </div>

          <h1 className="sv-station-name">
            <span className="sv-mono sv-designation">{active.id}</span>
            {/* Bind the em dash to the word before it so a line never opens on it. */}
            {active.name.replace(' — ', '\u00A0— ')}
          </h1>

          <dl className="sv-readout" key={epochIndex}>
            <div>
              <dt>Epoch</dt>
              <dd className="sv-restate">{epoch.stamp}</dd>
            </div>
            <div>
              <dt>Position σ</dt>
              <dd className="sv-restate">
                {active.sigma.toFixed(3)}
                <em>m</em>
              </dd>
            </div>
            <div>
              <dt>Δ since last</dt>
              <dd className={moved ? 'sv-restate sv-moved' : 'sv-restate'}>
                {active.delta > 0 ? '+' : ''}
                {active.delta.toFixed(3)}
                <em>m</em>
              </dd>
            </div>
          </dl>

          <div className="sv-epoch">
            <span className="sv-label" id="sv-epoch-label">
              Observation epoch
            </span>
            <div
              className="sv-epoch-track"
              role="group"
              aria-labelledby="sv-epoch-label"
              style={{ marginTop: '0.55rem' }}
            >
              {EPOCHS.map((e, i) => (
                <button
                  key={e.stamp}
                  type="button"
                  aria-pressed={i === epochIndex}
                  onClick={() => setEpochIndex(i)}
                >
                  {e.stamp}
                </button>
              ))}
            </div>
            <p className="sv-epoch-note">
              {epoch.note}
              {'. '}
              Pulling an epoch re-reads every station on the sheet — nothing reloads.
            </p>
          </div>

          <p className="sv-note" style={{ marginTop: '1.2rem' }}>
            {SYNTHETIC_NOTE}
          </p>

          <div className="sv-record-actions">
            <a className="sv-btn" href="#access">
              Request access
            </a>
            <a className="sv-btn sv-btn-ghost" href="/sim">
              Open the live reconstructions
            </a>
          </div>
        </div>

        <div className="sv-hero-plot">
          <NetworkPlot stations={stations} activeId={activeId} onSelect={setActiveId} />
        </div>
      </section>

      <div className="sv-rail">
        <div className="sv-shell sv-rail-in">
          <span>
            <b>CRS</b>
            {' '}
            Lambert-93 · RGF93 / IGN69
          </span>
          <span>
            <b>Anchor</b>
            {' '}
            {active.lat.toFixed(5)}
            {' '}
            N
            {' '}
            {active.lng.toFixed(5)}
            {' '}
            E
          </span>
          <span>
            <b>Elev</b>
            {' '}
            {active.elevation}
            {' '}
            m
          </span>
          <span>
            <b>Source</b>
            {' '}
            {active.source}
          </span>
          <span>
            <b>Observations</b>
            {' '}
            {active.observations}
          </span>
          <span className="sv-restate" key={`rail-epoch-${epochIndex}`}>
            <b>Epoch</b>
            {' '}
            {epoch.stamp}
          </span>
        </div>
      </div>
    </>
  );
}

/** The station mark: a circle with a centre point, as drawn on a survey sheet. */
function StationSigil() {
  return (
    <svg className="sv-sigil" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke="var(--signal)" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.6" fill="var(--signal)" />
    </svg>
  );
}
