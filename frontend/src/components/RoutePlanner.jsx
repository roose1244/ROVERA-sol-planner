import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Droplets, Gauge, BatteryCharging, Route } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PRESETS = [
  { name: "Jezero Crater", lat: 18.38, lon: 77.58 },
  { name: "Gale Crater", lat: -5.4, lon: 137.8 },
  { name: "Olympus Mons Base", lat: 18.65, lon: -133.8 },
  { name: "Valles Marineris Rim", lat: -13.9, lon: -59.2 },
  { name: "Meridiani Planum", lat: -2.0, lon: -5.94 },
];

const riskStyles = {
  LOW: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  MODERATE: "text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10",
  SEVERE: "text-[#E25B38] border-[#E25B38]/40 bg-[#E25B38]/10",
};

const RoutePlanner = ({ origin, plan, onPlan }) => {
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState("");

  const effectiveOrigin =
    origin || (preset ? PRESETS.find((p) => p.name === preset) : null);

  const calculate = async () => {
    if (!effectiveOrigin) {
      toast.error("No origin set — click the Mars globe or choose a preset site.");
      return;
    }
    setLoading(true);
    onPlan(null);
    try {
      const res = await fetch(`${API}/plan-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: effectiveOrigin.lat,
          lon: effectiveOrigin.lon,
          name: effectiveOrigin.name || preset,
        }),
      });
      if (!res.ok) throw new Error("planner offline");
      const data = await res.json();
      onPlan(data);
      toast.success(`Route locked — ${data.sols} sols to ${data.target.name}.`);
    } catch (e) {
      toast.error("Trajectory computer offline. Check the backend uplink.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Reveal>
      <div data-testid="route-planner-section" className="hud-glass scanlines relative rounded-xl p-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono-hud mb-2 text-[10px] tracking-[0.35em] text-[#F59E0B]">
              TRAJECTORY COMPUTER v4.2
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-slate-50">
              Route Planner
            </h3>
          </div>
          <Route className="h-6 w-6 text-[#E25B38]" />
        </div>

        <div className="font-mono-hud mb-4 rounded-lg border border-white/10 bg-[#07090E] px-4 py-3 text-xs tracking-[0.15em]">
          <span className="text-slate-500">ORIGIN // </span>
          {effectiveOrigin ? (
            <span data-testid="route-origin-readout" className="text-[#F59E0B]">
              {(effectiveOrigin.name || "SURFACE POINT").toUpperCase()} · {effectiveOrigin.lat.toFixed(2)}°,{" "}
              {effectiveOrigin.lon.toFixed(2)}°
            </span>
          ) : (
            <span data-testid="route-origin-readout" className="text-slate-600">
              UNSET — CLICK GLOBE OR SELECT SITE
            </span>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <select
            data-testid="route-origin-select"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="font-mono-hud w-full rounded-lg border border-white/10 bg-[#07090E] px-4 py-3 text-xs tracking-[0.15em] text-slate-300 outline-none transition-colors focus:border-[#E25B38]/60"
          >
            <option value="">SELECT PRESET SITE…</option>
            {PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name.toUpperCase()} · {p.lat}°, {p.lon}°
              </option>
            ))}
          </select>
          <button
            data-testid="route-calculate-button"
            onClick={calculate}
            disabled={loading}
            className="font-mono-hud group relative overflow-hidden bg-[#E25B38] px-7 py-3 text-xs font-bold tracking-[0.25em] text-[#07090E] transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> COMPUTING
              </span>
            ) : (
              "CALCULATE ROUTE"
            )}
          </button>
        </div>

        {plan ? (
          <div data-testid="route-summary-panel" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-[#07090E] p-5">
                <div className="font-mono-hud text-[10px] tracking-[0.3em] text-slate-500">
                  ESTIMATED TRANSIT
                </div>
                <div data-testid="route-sol-estimate" className="font-mono-hud mt-1 text-6xl font-bold text-[#E25B38]">
                  {plan.sols}
                </div>
                <div className="font-mono-hud text-[11px] tracking-[0.3em] text-slate-500">SOLS</div>
              </div>
              <div
                data-testid="route-deposit-target-card"
                className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-5"
              >
                <div className="font-mono-hud flex items-center gap-2 text-[10px] tracking-[0.3em] text-cyan-400">
                  <Droplets className="h-3.5 w-3.5" /> TARGET DEPOSIT
                </div>
                <div className="mt-2 text-base font-semibold leading-snug text-slate-100">
                  {plan.target.name}
                </div>
                <div className="font-mono-hud mt-1 text-[10px] tracking-[0.2em] text-slate-500">
                  {plan.target.type.toUpperCase()} · {plan.target.confidence}% CONF
                </div>
              </div>
            </div>

            <div className="font-mono-hud grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-white/10 bg-[#07090E] p-5 text-[11px] tracking-[0.15em] sm:grid-cols-3">
              <div>
                <MapPin className="mb-1 h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-500">DIST </span>
                <span className="text-slate-200">{plan.distance_km.toLocaleString()} KM</span>
              </div>
              <div>
                <Gauge className="mb-1 h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-500">SPEED </span>
                <span className="text-slate-200">{plan.avg_speed_kmh} KM/H</span>
              </div>
              <div>
                <BatteryCharging className="mb-1 h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-500">ARRIVAL CHARGE </span>
                <span className="text-slate-200">{plan.battery_reserve_pct}%</span>
              </div>
              <div>
                <span className="text-slate-500">DUST TAU </span>
                <span className="text-slate-200">{plan.dust_index}</span>
              </div>
              <div>
                <span className="text-slate-500">DAYLIGHT </span>
                <span className="text-slate-200">{plan.daylight_hours}H</span>
              </div>
              <div>
                <span className="text-slate-500">WAYPOINTS </span>
                <span className="text-slate-200">{plan.waypoints}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                data-testid="route-risk-badge"
                className={`font-mono-hud rounded-full border px-4 py-1.5 text-[10px] tracking-[0.3em] ${riskStyles[plan.risk_level]}`}
              >
                RISK: {plan.risk_level}
              </span>
              <span className="font-mono-hud text-[10px] tracking-[0.2em] text-slate-600">
                DEPARTURE SOL {plan.sol_of_departure}
              </span>
            </div>
          </div>
        ) : (
          <div className="font-mono-hud rounded-lg border border-dashed border-white/10 px-4 py-10 text-center text-[11px] tracking-[0.25em] text-slate-600">
            {loading ? "SOLVING TRAVERSE GRAPH…" : "AWAITING ORIGIN COORDINATES"}
          </div>
        )}
      </div>
    </Reveal>
  );
};

export default RoutePlanner;
