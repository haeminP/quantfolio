"use client";

import { useState } from "react";

// ─── Tech Stack Data ───────────────────────────────────────────

type Layer = "frontend" | "api" | "backend" | "data";

const LAYERS: {
  id: Layer;
  label: string;
  icon: string;
  color: string;
  bg: string;
  techs: { name: string; role: string; why: string }[];
}[] = [
  {
    id: "frontend",
    label: "Frontend",
    icon: "web",
    color: "#565e74",
    bg: "bg-primary-container/40",
    techs: [
      {
        name: "Next.js 16",
        role: "React framework with App Router",
        why: "App Router enables shared layouts — sidebar and top nav persist across page navigations without re-rendering. This mirrors how real trading terminals feel.",
      },
      {
        name: "TypeScript",
        role: "Type-safe development",
        why: "Catches API contract mismatches at compile time. When the backend returns { prices: number[] }, the frontend knows immediately if it tries to treat it as a string.",
      },
      {
        name: "Tailwind CSS v4",
        role: "Utility-first styling with CSS @theme tokens",
        why: "MD3 design tokens defined once in @theme, consumed everywhere. No separate config file — the CSS itself is the source of truth for the design system.",
      },
      {
        name: "Recharts",
        role: "Composable chart components",
        why: "Declarative React components that compose naturally — overlay a Scatter on a LineChart, add a hidden YAxis for dual scales. No imperative D3 wrangling needed.",
      },
    ],
  },
  {
    id: "api",
    label: "API Layer",
    icon: "swap_horiz",
    color: "#006b62",
    bg: "bg-secondary-container/40",
    techs: [
      {
        name: "FastAPI",
        role: "Async Python web framework",
        why: "Same Python runtime as ML4T course code — no language boundary. Auto-generates OpenAPI docs, so the frontend team (also me) always has an up-to-date API reference.",
      },
      {
        name: "CORS Middleware",
        role: "Cross-origin request handling",
        why: "Frontend (port 3000) and backend (port 8000) run on different origins in development. CORS headers allow the browser to make cross-origin API calls.",
      },
    ],
  },
  {
    id: "backend",
    label: "ML Modules",
    icon: "psychology",
    color: "#605c78",
    bg: "bg-tertiary-container/40",
    techs: [
      {
        name: "ML4T Bridge",
        role: "sys.path injection to import course modules",
        why: "Instead of duplicating or rewriting course code, the bridge adds ML4T directories to Python's import path. One source of truth — if the learner code changes, the dashboard reflects it instantly.",
      },
      {
        name: "DTLearner / RTLearner",
        role: "Decision & Random Tree implementations",
        why: "Core ML models from the course. The API wraps them with a learning curve experiment that sweeps leaf_size, abstracting numpy arrays into JSON-friendly results.",
      },
      {
        name: "BagLearner / InsaneLearner",
        role: "Ensemble methods",
        why: "BagLearner reduces variance via bootstrap aggregation. InsaneLearner (400 LinRegLearners) demonstrates that ensembling can't fix bias — a key ML concept visualized in the Learner Playground.",
      },
      {
        name: "Indicators Module",
        role: "Technical analysis computations",
        why: "Computes BBP, SMA ratio, Momentum, MACD, and Stochastic %K using pandas. The API exposes these as arrays aligned with price dates for easy chart rendering.",
      },
    ],
  },
  {
    id: "data",
    label: "Data Layer",
    icon: "database",
    color: "#9f403d",
    bg: "bg-error-container/30",
    techs: [
      {
        name: "Local CSV Files",
        role: "Historical price data (2000–2012)",
        why: "Course-provided data for consistent, reproducible results. No external API dependency during development — the dashboard works fully offline.",
      },
      {
        name: "Yahoo Finance API",
        role: "Live market data (planned)",
        why: "Extends the dashboard beyond course data to real-time analysis. Same indicator pipeline, different data source — the abstraction in load_prices() makes this a drop-in replacement.",
      },
    ],
  },
];


// ─── Component ─────────────────────────────────────────────────

export default function SystemArchitecture() {
  const [activeLayer, setActiveLayer] = useState<Layer | null>(null);

  return (
    <>
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-mono">
            Architecture
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">
          System Architecture
        </h1>
        <p className="text-on-surface-variant text-sm mt-1 max-w-2xl">
          How the frontend, API, ML modules, and data layer connect to power
          interactive ML visualizations.
        </p>
      </header>

      {/* ── System Overview Diagram ── */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">schema</span>
          System Overview
        </h2>
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {LAYERS.map((layer, i) => (
              <div key={layer.id} className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() =>
                    setActiveLayer(activeLayer === layer.id ? null : layer.id)
                  }
                  className={`flex-1 min-w-[160px] rounded-xl p-5 transition-all border-2 cursor-pointer ${
                    activeLayer === layer.id
                      ? "border-current shadow-lg scale-[1.02]"
                      : "border-transparent hover:border-outline-variant/20 hover:shadow-md"
                  } ${layer.bg}`}
                  style={{
                    color: layer.color,
                  }}
                >
                  <span className="material-symbols-outlined text-2xl mb-2 block">
                    {layer.icon}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">
                    {layer.label}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-mono">
                    {layer.techs.map((t) => t.name.split(" ")[0]).join(" · ")}
                  </p>
                </button>
                {i < LAYERS.length - 1 && (
                  <span
                    className="material-symbols-outlined text-on-surface-variant/30 text-xl shrink-0"
                  >
                    arrow_forward
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack Cards ── */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">layers</span>
          Tech Stack
          {activeLayer && (
            <span className="text-primary font-mono normal-case tracking-normal">
              — {LAYERS.find((l) => l.id === activeLayer)?.label}
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeLayer
            ? LAYERS.filter((l) => l.id === activeLayer)
            : LAYERS
          ).map((layer) =>
            layer.techs.map((tech) => (
              <div
                key={tech.name}
                className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: layer.color }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">
                      {tech.name}
                    </h4>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                      {tech.role}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-on-surface-variant pl-5">
                  {tech.why}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

    </>
  );
}
