import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";

const Card = ({ testId, label, children, delay }) => (
  <Reveal delay={delay} className="h-full">
    <div
      data-testid={testId}
      className="hud-glass group relative h-full overflow-hidden rounded-xl p-6 transition-colors duration-300 hover:border-[#E25B38]/40"
    >
      <div className="absolute left-0 top-0 h-px w-0 bg-[#E25B38] transition-all duration-500 group-hover:w-full" />
      <div className="font-mono-hud mb-4 text-[10px] tracking-[0.35em] text-slate-500">{label}</div>
      {children}
    </div>
  </Reveal>
);

const TelemetryHud = () => {
  const [sol, setSol] = useState(842);
  const [tau, setTau] = useState(0.42);
  const [daylight, setDaylight] = useState(11 * 3600 + 24 * 60 + 31);
  const [pressure, setPressure] = useState(612);
  const riskBars = [0.35, 0.5, 0.62, 0.48, 0.7, 0.55, 0.4, 0.3];

  useEffect(() => {
    const id = setInterval(() => setDaylight((d) => (d <= 0 ? 12 * 3600 : d - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSol((s) => s + 1);
      setPressure(605 + Math.round(Math.random() * 14));
    }, 9000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const efficiency = Math.round((1 - tau) * 100);

  return (
    <section id="telemetry" data-testid="telemetry-hud-section" className="relative">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <Reveal>
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="font-mono-hud mb-3 text-[11px] tracking-[0.4em] text-[#F59E0B]">
                ELYSIUM RELAY // LIVE DOWNLINK
              </div>
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                Telemetry
              </h2>
            </div>
            <div className="font-mono-hud text-[11px] tracking-[0.25em] text-slate-500">
              SIGNAL DELAY 12M 41S · DSN MADRID
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card testId="telemetry-card-sol" label="MISSION ELAPSED" delay={0}>
            <div className="font-mono-hud text-5xl font-bold text-slate-50">{sol}</div>
            <div className="font-mono-hud mt-2 text-[11px] tracking-[0.25em] text-emerald-400">
              SOLS · NOMINAL
            </div>
          </Card>

          <Card testId="telemetry-card-dust" label="DUST OPACITY · TAU" delay={0.08}>
            <div className="font-mono-hud text-5xl font-bold text-[#F59E0B]">{tau.toFixed(2)}</div>
            <input
              data-testid="telemetry-dust-slider"
              type="range"
              min="0.1"
              max="0.95"
              step="0.01"
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value))}
              className="mt-4 w-full accent-[#E25B38]"
            />
            <div className="font-mono-hud mt-2 text-[11px] tracking-[0.25em] text-slate-500">
              DRIVE EFFICIENCY {efficiency}%
            </div>
          </Card>

          <Card testId="telemetry-card-daylight" label="DAYLIGHT WINDOW REMAINING" delay={0.16}>
            <div className="font-mono-hud text-5xl font-bold text-slate-50 tabular-nums">
              {fmt(daylight)}
            </div>
            <div className="font-mono-hud mt-2 text-[11px] tracking-[0.25em] text-slate-500">
              DRIVE CEASES AT DUSK
            </div>
          </Card>

          <Card testId="telemetry-card-terrain" label="TERRAIN SLOPE RISK" delay={0.24}>
            <div className="flex h-14 items-end gap-1.5">
              {riskBars.map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h * 100}%` }}
                  className={`w-full rounded-sm transition-all duration-300 ${
                    h > 0.6 ? "bg-[#E25B38]" : h > 0.45 ? "bg-[#F59E0B]" : "bg-emerald-500/70"
                  } group-hover:opacity-80`}
                />
              ))}
            </div>
            <div className="font-mono-hud mt-3 text-[11px] tracking-[0.25em] text-[#F59E0B]">
              MODERATE · SECTOR 7G
            </div>
          </Card>
        </div>

        <Reveal delay={0.2}>
          <div className="font-mono-hud mt-5 flex flex-wrap gap-x-10 gap-y-2 rounded-xl border border-white/5 bg-[#0A0D14] px-6 py-4 text-[11px] tracking-[0.25em] text-slate-500">
            <span>
              ATMOSPHERIC PRESSURE <span className="text-slate-300">{pressure} PA</span>
            </span>
            <span>
              GROUND TEMP <span className="text-slate-300">−61°C</span>
            </span>
            <span>
              WIND <span className="text-slate-300">7.2 M/S NW</span>
            </span>
            <span>
              ROVER CHARGE <span className="text-emerald-400">94%</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default TelemetryHud;
