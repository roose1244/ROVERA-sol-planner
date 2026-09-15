import { useEffect, useRef, useState } from "react";
import "@/App.css";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import TelemetryHud from "@/components/TelemetryHud";
import RoutePlanner from "@/components/RoutePlanner";
import AiBriefing from "@/components/AiBriefing";
import Manifesto from "@/components/Manifesto";
import Footer from "@/components/Footer";
import SurfaceView from "@/components/SurfaceView";

function App() {
  const lenisRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [plan, setPlan] = useState(null);
  const [descent, setDescent] = useState(null);
  const [surfaceOpen, setSurfaceOpen] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const scrollTo = (id) => {
    lenisRef.current?.scrollTo(id, { offset: -72, duration: 1.6 });
  };

  const handleSelectOrigin = (lat, lon) => {
    setOrigin({ lat, lon, name: "Surface point" });
    setPlan(null);
    setDescent({ lat, lon });
  };

  const handleDescentArrive = () => {
    setSurfaceOpen(true);
    lenisRef.current?.stop();
  };

  const handleCloseSurface = () => {
    setSurfaceOpen(false);
    setDescent(null);
    lenisRef.current?.start();
  };

  const handleReset = () => {
    setOrigin(null);
    setPlan(null);
    setDescent(null);
    setSurfaceOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100" data-testid="rovera-app">
      <div className="noise-overlay" />
      <Toaster theme="dark" position="bottom-right" />
      <NavBar onNavigate={scrollTo} />
      <main>
        <Hero
          origin={origin}
          plan={plan}
          descent={descent}
          onSelectOrigin={handleSelectOrigin}
          onReset={handleReset}
          onNavigate={scrollTo}
          onDescentArrive={handleDescentArrive}
        />
        <Marquee />
        <TelemetryHud />
        <section id="planner" className="relative">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-24 lg:grid-cols-2 lg:py-32">
            <RoutePlanner origin={origin} plan={plan} onPlan={setPlan} onNavigate={scrollTo} />
            <AiBriefing origin={origin} plan={plan} />
          </div>
        </section>
        <Manifesto />
        <Footer />
      </main>
      <SurfaceView open={surfaceOpen} coords={origin} onClose={handleCloseSurface} />
    </div>
  );
}

export default App;
