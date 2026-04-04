export default function LearnerPlayground() {
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
              0.0248
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex flex-col justify-between border border-outline-variant/10">
          <span className="text-on-surface-variant font-medium uppercase tracking-widest text-[0.7rem]">
            Iterations
          </span>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-on-surface">
              1,240
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex flex-col justify-between border border-outline-variant/10">
          <span className="text-on-surface-variant font-medium uppercase tracking-widest text-[0.7rem]">
            Time to Fit
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-on-surface">
              428
            </span>
            <span className="text-sm font-medium text-on-surface-variant">
              ms
            </span>
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
                Cross-validation error across training epochs
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

          {/* Placeholder chart area */}
          <div className="h-[400px] w-full flex items-center justify-center text-on-surface-variant/40 text-sm">
            Chart will render here with Recharts
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
                  <select className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-4 text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer">
                    <option>Decision Tree</option>
                    <option>Random Tree</option>
                    <option>Bagged Learner</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Leaf Size Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                    Leaf Size
                  </label>
                  <span className="font-mono text-sm font-bold text-primary">
                    5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  defaultValue="5"
                  className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Number of Bags Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                    Number of Bags
                  </label>
                  <span className="font-mono text-sm font-bold text-primary">
                    20
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  defaultValue="20"
                  className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Run Button */}
              <div className="pt-4">
                <button className="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    play_arrow
                  </span>
                  Run Simulation
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
              Increasing the <strong>Number of Bags</strong> generally reduces
              variance but may increase computational time linearly. Watch for
              the &apos;Time to Fit&apos; metric as you scale.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
