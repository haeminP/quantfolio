export default function TopNav() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm shadow-slate-200/50">
      <div className="flex justify-between items-center h-16 px-6 w-full">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-slate-900">
            Quantfolio
          </span>
          <nav className="hidden md:flex gap-6 items-center">
            <a className="text-sm tracking-tight font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">
              Portfolio
            </a>
            <a className="text-sm tracking-tight font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">
              Market
            </a>
            <a className="text-sm tracking-tight font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">
              Analysis
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 mr-4">
            <button className="material-symbols-outlined p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
              notifications
            </button>
            <button className="material-symbols-outlined p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
              settings
            </button>
          </div>
          <button className="px-4 py-1.5 text-sm font-medium rounded-xl bg-surface-container-high text-on-primary-fixed hover:bg-surface-container-highest transition-colors active:scale-95">
            Deposit
          </button>
          <button className="px-5 py-1.5 text-sm font-bold text-white rounded-xl bg-gradient-to-br from-primary to-primary-dim shadow-sm active:scale-95 transition-all">
            Trade
          </button>
        </div>
      </div>
    </header>
  );
}
