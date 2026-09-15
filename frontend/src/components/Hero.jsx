import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Crosshair } from "lucide-react";
import MarsGlobe from "@/components/MarsGlobe";
import { MaskedLine } from "@/components/Reveal";

const TITLE = "ROVERA";

const Hero = ({ origin, plan, onSelectOrigin, onReset, onNavigate }) => {
  const [hover, setHover] = useState({ lat: null, lon: null });

  return (
    <section
      id="hero"
      data-testid="hero-section"
      className="relative flex min-h-screen items-center overflow-hidden pt-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(226,91,56,0.08),transparent_55%)]" />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-6 lg:grid-cols-2">
        <div className="relative z-10 py-16 lg:py-0">
          <MaskedLine delay={0.15}>
            <span className="font-mono-hud text-[11px] tracking-[0.4em] text-[#F59E0B]">
              ARES-IV MISSION CONTROL // ROUTE PLANNING DIVISION
            </span>
          </MaskedLine>

          <h1
            data-testid="hero-headline-masked"
            className="font-display mt-6 whitespace-nowrap text-[16vw] font-extrabold leading-[0.9] tracking-tight text-slate-50 sm:text-[11vw] lg:text-[6rem] xl:text-[7rem]"
          >
            {TITLE.split("").map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "112%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 1.05, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </h1>

          <div className="mt-8 max-w-xl">
            <MaskedLine delay={0.9} className="text-2xl font-light text-slate-200 sm:text-3xl">
              <span>From any point on Mars to the nearest water.</span>
            </MaskedLine>
            <MaskedLine delay={1.05} className="text-2xl font-light text-slate-400 sm:text-3xl">
              <span>
                Terrain, daylight and dust —{" "}
                <span className="text-[#E25B38]">priced in sols.</span>
              </span>
            </MaskedLine>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-cta-simulate"
              onClick={() => onNavigate("#planner")}
              className="font-mono-hud group relative overflow-hidden bg-[#E25B38] px-8 py-4 text-xs tracking-[0.3em] text-[#07090E] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 -translate-x-full bg-[#F59E0B] transition-transform duration-300 ease-out group-hover:translate-x-0" />
              <span className="relative font-bold">RUN ROUTE SIMULATION</span>
            </button>
            <div className="font-mono-hud flex items-center gap-2 text-[11px] tracking-[0.2em] text-slate-500">
              <Crosshair className="h-3.5 w-3.5 text-[#F59E0B]" />
              CLICK THE PLANET TO SET ORIGIN
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[60vh] lg:h-[82vh]"
        >
          <div data-testid="hero-mars-canvas" className="absolute inset-0 cursor-crosshair">
            <MarsGlobe
              origin={origin}
              target={plan?.target || null}
              onSelect={onSelectOrigin}
              onHover={(lat, lon) => setHover({ lat, lon })}
            />
          </div>

          <div className="hud-glass font-mono-hud pointer-events-none absolute left-0 top-6 rounded-lg px-4 py-3 text-[10px] leading-relaxed tracking-[0.2em] text-slate-400">
            <div className="text-[#E25B38]">MARS // AREOCENTRIC</div>
            <div>ROT 24.6229H · R 3389.5KM</div>
            <div>AXIAL TILT 25.19°</div>
          </div>

          <div
            data-testid="hero-coordinate-display"
            className="hud-glass font-mono-hud pointer-events-none absolute bottom-6 left-0 rounded-lg px-4 py-3 text-[10px] leading-relaxed tracking-[0.2em] text-slate-400"
          >
            <div className="text-slate-500">CURSOR</div>
            <div className="text-emerald-400">
              LAT {hover.lat !== null ? hover.lat.toFixed(2) : "--.--"}° · LON{" "}
              {hover.lon !== null ? hover.lon.toFixed(2) : "---.--"}°
            </div>
            {origin && (
              <div className="mt-1 border-t border-white/10 pt-1 text-[#F59E0B]">
                ORIGIN {origin.lat.toFixed(2)}°, {origin.lon.toFixed(2)}°
              </div>
            )}
          </div>

          {origin && (
            <button
              data-testid="hero-reset-globe-button"
              onClick={onReset}
              className="hud-glass font-mono-hud absolute bottom-6 right-0 flex items-center gap-2 rounded-lg px-4 py-3 text-[10px] tracking-[0.25em] text-slate-300 transition-colors hover:text-[#E25B38]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              RESET
            </button>
          )}
        </motion.div>
      </div>

      <div
        data-testid="hero-scroll-hint"
        className="absolute bottom-6 left-8 hidden -translate-x-0 flex-col items-start gap-3 lg:flex"
      >
        <span className="font-mono-hud text-[10px] tracking-[0.4em] text-slate-500">
          SCROLL // MISSION BRIEF
        </span>
        <span className="animate-scroll-hint block h-10 w-px bg-[#E25B38]" />
      </div>
    </section>
  );
};

export default Hero;
