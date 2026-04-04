"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const API_BASE = "http://localhost:8000";

type ExperimentResult = {
  leaf_size: number;
  train_rmse: number;
  test_rmse: number;
};

type ExperimentResponse = {
  results: ExperimentResult[];
  best_leaf_size: number;
  best_rmse: number;
  train_samples: number;
  test_samples: number;
};

export default function LearnerPlayground() {
  const [learnerType, setLearnerType] = useState("dt");
  const [maxLeafSize, setMaxLeafSize] = useState(50);
  const [bags, setBags] = useState(20);
  const [data, setData] = useState<ExperimentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const runExperiment = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const params = new URLSearchParams({
        learner_type: learnerType,
        max_leaf_size: maxLeafSize.toString(),
        bags: bags.toString(),
      });
      const res = await fetch(`${API_BASE}/api/learners/experiment?${params}`);
      const json: ExperimentResponse = await res.json();
      setData(json);
      setElapsed(Math.round(performance.now() - start));
    } catch {
      console.error("API request failed");
    } finally {
      setLoading(false);
    }
  };

  const bestRmse = data?.best_rmse?.toFixed(4) ?? "—";
  const iterations = data?.results.length.toLocaleString() ?? "—";
  const timeToFit = elapsed !== null ? `${elapsed}` : "—";

  return (
    <>
      <header className="mb-10">
        <h1 className="text-[2.5rem] font-extrabold tracking-tight text-on-surface leading-tight">
          Learner Playground
        </h1>
        <p className="text-on-surface-variant font-medium text-lg mt-1 opacity-80">
          Refine model architecture and observe convergence in real-time.
        </p>
      </header>

      {/* Summary Statistics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary-container p-6 rounded-xl flex flex-col justify-between">
          <span className="text-on-surface-variant font-medium uppercase tracking-widest text-[0.7rem]">
            Best RMSE
          </span>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-on-primary-fixed">
              {bestRmse}
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex flex-col justify-between border border-outline-variant/10">
          <span className="text-on-surface-variant font-medium uppercase tracking-widest text-[0.7rem]">
            Leaf Sizes Tested
          </span>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-on-surface">
              {iterations}
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex flex-col justify-between border border-outline-variant/10">
          <span className="text-on-surface-variant font-medium uppercase tracking-widest text-[0.7rem]">
            Time to Fit
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-on-surface">
              {timeToFit}
            </span>
            {elapsed !== null && (
              <span className="text-sm font-medium text-on-surface-variant">
                ms
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <div className="grid grid-cols-12 gap-8">
        {/* Learning Curve Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Learning Curve
              </h3>
              <p className="text-on-surface-variant text-xs mt-1">
                Train vs test RMSE across leaf sizes
              </p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/20" />
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                  Training Error
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary shadow-sm shadow-secondary/20" />
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                  Testing Error
                </span>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            {data ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.results}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#a9b4b9"
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    dataKey="leaf_size"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    stroke="#566166"
                    label={{
                      value: "Leaf Size",
                      position: "insideBottom",
                      offset: -5,
                      style: {
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fill: "#566166",
                      },
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    stroke="#566166"
                    label={{
                      value: "RMSE",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fill: "#566166",
                      },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(12px)",
                      border: "none",
                      borderRadius: "0.75rem",
                      boxShadow: "0px 4px 20px rgba(42,52,57,0.08)",
                      fontFamily: "JetBrains Mono",
                      fontSize: 12,
                    }}
                    formatter={(value) => typeof value === "number" ? value.toFixed(4) : value}
                  />
                  {data.best_leaf_size && (
                    <ReferenceLine
                      x={data.best_leaf_size}
                      stroke="#dae2fd"
                      strokeWidth={20}
                      strokeOpacity={0.5}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="train_rmse"
                    stroke="#565e74"
                    strokeWidth={2.5}
                    dot={false}
                    name="Train RMSE"
                  />
                  <Line
                    type="monotone"
                    dataKey="test_rmse"
                    stroke="#006b62"
                    strokeWidth={2.5}
                    dot={false}
                    name="Test RMSE"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant/40 text-sm">
                {loading
                  ? "Computing learning curves..."
                  : "Configure parameters and run simulation"}
              </div>
            )}
          </div>
        </div>

        {/* Side Controls */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-8">
              Model Parameters
            </h3>
            <div className="space-y-8">
              {/* Model Selection */}
              <div className="space-y-3">
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                  Model Selection
                </label>
                <div className="relative">
                  <select
                    value={learnerType}
                    onChange={(e) => setLearnerType(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-4 text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                  >
                    <option value="dt">Decision Tree</option>
                    <option value="rt">Random Tree</option>
                    <option value="bag">Bagged Learner</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Max Leaf Size Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                    Max Leaf Size
                  </label>
                  <span className="font-mono text-sm font-bold text-primary">
                    {maxLeafSize}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={maxLeafSize}
                  onChange={(e) => setMaxLeafSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Number of Bags Slider */}
              {learnerType === "bag" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                      Number of Bags
                    </label>
                    <span className="font-mono text-sm font-bold text-primary">
                      {bags}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={bags}
                    onChange={(e) => setBags(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}

              {/* Run Button */}
              <div className="pt-4">
                <button
                  onClick={runExperiment}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {loading ? "hourglass_top" : "play_arrow"}
                  </span>
                  {loading ? "Running..." : "Run Simulation"}
                </button>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                info
              </span>
              <h4 className="text-sm font-bold text-on-surface">
                Learner Tip
              </h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A small <strong>leaf size</strong> leads to overfitting (low train
              error, high test error). As leaf size grows, the model
              generalizes better. The sweet spot is where test error is
              minimized — highlighted in the chart.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
