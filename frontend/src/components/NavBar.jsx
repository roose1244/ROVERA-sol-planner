import { useEffect, useState } from "react";

const SOL_START = 842;

const NavBar = ({ onNavigate }) => {
  const [sol] = useState(SOL_START);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toUTCString().slice(17, 25)
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      data-testid="nav-bar"
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <button
          data-testid="nav-logo"
          onClick={() => onNavigate(0)}
          className="group flex items-center gap-3"
        >
          <span className="block h-3.5 w-3.5 rotate-45 bg-[#E25B38] transition-transform duration-500 group-hover:rotate-[225deg]" />
          <span className="font-display text-lg font-extrabold tracking-[0.3em] text-slate-100">
            ROVERA
          </span>
        </button>

        <div
          data-testid="nav-status-indicator"
          className="font-mono-hud hidden items-center gap-2 text-[11px] tracking-[0.2em] text-emerald-400/90 md:flex"
        >
          <span className="animate-pulse-dot block h-2 w-2 rounded-full bg-emerald-400" />
          SOL {sol} · LINK ONLINE · {time} UTC
        </div>

        <nav className="flex items-center gap-6">
          <button
            data-testid="nav-link-telemetry"
            onClick={() => onNavigate("#telemetry")}
            className="font-mono-hud hidden text-[11px] tracking-[0.25em] text-slate-400 transition-colors hover:text-[#F59E0B] lg:block"
          >
            TELEMETRY
          </button>
          <button
            data-testid="nav-link-manifesto"
            onClick={() => onNavigate("#manifesto")}
            className="font-mono-hud hidden text-[11px] tracking-[0.25em] text-slate-400 transition-colors hover:text-[#F59E0B] lg:block"
          >
            MANIFESTO
          </button>
          <button
            data-testid="nav-cta-launch"
            onClick={() => onNavigate("#planner")}
            className="font-mono-hud group relative overflow-hidden border border-[#E25B38]/60 px-5 py-2 text-[11px] tracking-[0.25em] text-[#E25B38] transition-colors duration-300 hover:text-[#07090E]"
          >
            <span className="absolute inset-0 -translate-x-full bg-[#E25B38] transition-transform duration-300 ease-out group-hover:translate-x-0" />
            <span className="relative">LAUNCH PLANNER</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
