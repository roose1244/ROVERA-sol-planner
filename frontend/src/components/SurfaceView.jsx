import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, Loader2 } from "lucide-react";

const SURFACE_URL = "https://rover-timeline.preview.emergentagent.com/";

const SurfaceView = ({ open, coords, onClose }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) setLoaded(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="surface-view-overlay"
          className="fixed inset-0 z-[70] flex flex-col bg-[#05070B]"
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#07090E]/90 px-5 backdrop-blur-xl">
            <div className="font-mono-hud flex items-center gap-3 text-[11px] tracking-[0.25em]">
              <span className="animate-pulse-dot block h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">SURFACE LINK ESTABLISHED</span>
              {coords && (
                <span className="hidden text-slate-500 sm:inline">
                  // LAT {coords.lat.toFixed(2)}° · LON {coords.lon.toFixed(2)}°
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono-hud hidden text-[10px] tracking-[0.3em] text-slate-600 md:inline">
                SOL-WINDOW PLANNER · TERRAIN VIEW
              </span>
              <button
                data-testid="surface-return-button"
                onClick={onClose}
                className="font-mono-hud group relative overflow-hidden border border-[#E25B38]/60 px-4 py-2 text-[10px] tracking-[0.25em] text-[#E25B38] transition-colors duration-300 hover:text-[#07090E]"
              >
                <span className="absolute inset-0 -translate-x-full bg-[#E25B38] transition-transform duration-300 ease-out group-hover:translate-x-0" />
                <span className="relative flex items-center gap-2">
                  <Undo2 className="h-3.5 w-3.5" /> RETURN TO ORBIT
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            {!loaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#05070B]">
                <Loader2 className="h-6 w-6 animate-spin text-[#F59E0B]" />
                <span className="font-mono-hud text-[11px] tracking-[0.35em] text-slate-500">
                  DESCENDING THROUGH DUST LAYER…
                </span>
              </div>
            )}
            <iframe
              data-testid="surface-iframe"
              title="ROVERA surface terrain — Sol-Window Planner"
              src={SURFACE_URL}
              onLoad={() => setLoaded(true)}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            />
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-[#F59E0B]/50" />
              <span className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-[#F59E0B]/50" />
              <span className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-[#F59E0B]/50" />
              <span className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-[#F59E0B]/50" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SurfaceView;
