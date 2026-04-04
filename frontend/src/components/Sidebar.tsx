"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/learner", label: "Learner Playground", icon: "school" },
  { href: "/indicators", label: "Indicator Explorer", icon: "query_stats" },
  { href: "/strategy", label: "Strategy Battle", icon: "swords" },
  { href: "/architecture", label: "System Architecture", icon: "architecture" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-50 flex flex-col p-4 gap-y-2 z-40 pt-20">
      <div className="mb-6 px-2">
        <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
          Institutional Grade
        </h2>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-1 ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                  : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <a className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-200/50 rounded-lg transition-all duration-300" href="#">
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="font-mono text-xs uppercase tracking-widest font-semibold">
            Help Center
          </span>
        </a>
        <a className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-200/50 rounded-lg transition-all duration-300" href="#">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="font-mono text-xs uppercase tracking-widest font-semibold">
            Account
          </span>
        </a>
      </div>
    </aside>
  );
}
