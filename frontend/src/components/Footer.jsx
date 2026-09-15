import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const Footer = () => {
  const [email, setEmail] = useState("");

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid comms address.");
      return;
    }
    toast.success("Uplink confirmed — briefings will arrive each sol.");
    setEmail("");
  };

  return (
    <footer data-testid="mission-footer" className="relative overflow-hidden border-t border-white/10 bg-[#05070B]">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20">
        <Reveal>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <div className="font-mono-hud mb-3 text-[11px] tracking-[0.4em] text-[#F59E0B]">
                TRANSMISSION ENDS
              </div>
              <p className="max-w-md text-base font-light leading-relaxed text-slate-400">
                ROVERA is a mission-control simulator. Distances use an areocentric great-circle model;
                sol estimates are simulated from terrain, daylight and dust constraints. Not flight-certified.
              </p>
              <div className="font-mono-hud mt-6 flex items-center gap-2 text-[11px] tracking-[0.25em] text-emerald-400">
                <span className="animate-pulse-dot block h-2 w-2 rounded-full bg-emerald-400" />
                API UPLINK NOMINAL
              </div>
            </div>
            <div>
              <div className="font-mono-hud mb-3 text-[11px] tracking-[0.4em] text-slate-500">
                RECEIVE SOL BRIEFINGS
              </div>
              <form onSubmit={subscribe} className="flex gap-3">
                <input
                  data-testid="footer-briefing-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="COMMS@ADDRESS.EARTH"
                  className="font-mono-hud w-full rounded-lg border border-white/10 bg-[#0A0D14] px-4 py-3 text-xs tracking-[0.2em] text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-[#E25B38]/60"
                />
                <button
                  data-testid="footer-briefing-submit"
                  type="submit"
                  className="font-mono-hud flex items-center gap-2 rounded-lg bg-[#E25B38] px-5 py-3 text-xs font-bold tracking-[0.2em] text-[#07090E] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  UPLINK <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
              <div className="font-mono-hud mt-6 text-[10px] tracking-[0.25em] text-slate-600">
                AREOCENTRIC COORD NET · 18.38°N 77.58°E · JEZERO RELAY
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 select-none overflow-hidden">
          <div className="text-outline font-display whitespace-nowrap text-center text-[18vw] font-extrabold leading-none opacity-40 lg:text-[11rem]">
            ROVERA
          </div>
        </div>

        <div className="font-mono-hud mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 text-[10px] tracking-[0.3em] text-slate-600">
          <span>© SOL 842 · ROVERA MISSION CONTROL</span>
          <span>MARS · AREOCENTRIC · SIMULATED DATA</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
