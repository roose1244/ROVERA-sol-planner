import { Reveal } from "@/components/Reveal";

const CHAPTERS = [
  {
    num: "01",
    title: "WATER IS THE SOL",
    body: "Every traverse on Mars is a negotiation with thirst. ROVERA maps confirmed and suspected water-ice deposits — from Korolev's permanent sheet to buried Arcadia glaciers — and treats each one as the only currency that matters: reachable, extractable water.",
    img: "https://images.unsplash.com/photo-1647322878142-1c3b5f339f45?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    alt: "Martian dune field under a dark sky",
  },
  {
    num: "02",
    title: "TERRAIN BEFORE TRAJECTORY",
    body: "The shortest line is rarely the fastest one. Slope grade, regolith depth and basalt fields are priced into every candidate path, so a longer route across firm mare can beat a direct line through a dune sea.",
    img: "https://images.unsplash.com/photo-1527826507412-72e447368aa1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    alt: "Rippled Martian sand terrain",
  },
  {
    num: "03",
    title: "DAYLIGHT AND DUST",
    body: "A rover that drives at night is a rover that dies. ROVERA models the shrinking daylight window through dust season, derating speed and solar intake as opacity climbs — and tells you when the only safe move is to wait.",
    img: "https://images.unsplash.com/photo-1635349429385-201ee3a51b88?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    alt: "Martian mountains at night",
  },
  {
    num: "04",
    title: "EVERY SOL ACCOUNTED",
    body: "The output is a single number you can plan a mission around: sols to water, with risk stated plainly. No optimism bias, no heroic assumptions — just the traverse as Mars will actually allow it.",
    img: "https://images.unsplash.com/photo-1614315517650-3771cf72d18a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    alt: "Crew member on the Martian surface",
  },
];

const Manifesto = () => (
  <section id="manifesto" data-testid="manifesto-section" className="relative border-t border-white/5">
    <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
      <Reveal>
        <div className="font-mono-hud mb-3 text-[11px] tracking-[0.4em] text-[#F59E0B]">
          THE ROVERA DOCTRINE
        </div>
        <h2 className="font-display mb-20 text-3xl font-extrabold uppercase tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
          Manifesto
        </h2>
      </Reveal>

      <div className="space-y-24 lg:space-y-32">
        {CHAPTERS.map((c, i) => (
          <div
            key={c.num}
            data-testid={`manifesto-chapter-${i + 1}`}
            className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-12 ${
              i % 2 === 1 ? "lg:[direction:rtl]" : ""
            }`}
          >
            <Reveal className="lg:col-span-7 [direction:ltr]">
              <div className="flex items-start gap-6">
                <span className="text-outline font-display text-7xl font-extrabold leading-none sm:text-8xl">
                  {c.num}
                </span>
                <div>
                  <h3 className="font-display mb-4 text-2xl font-extrabold uppercase tracking-tight text-slate-100 sm:text-3xl">
                    {c.title}
                  </h3>
                  <p className="max-w-lg text-base font-light leading-relaxed text-slate-400">
                    {c.body}
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-5 [direction:ltr]">
              <div className="group relative overflow-hidden rounded-xl border border-white/10">
                <img
                  src={c.img}
                  alt={c.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover saturate-[0.75] transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#E25B38]/10 mix-blend-overlay" />
                <div className="font-mono-hud absolute bottom-3 left-3 rounded bg-[#07090E]/80 px-3 py-1.5 text-[9px] tracking-[0.3em] text-slate-400 backdrop-blur">
                  FIG {c.num} // ORBITAL SURVEY
                </div>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Manifesto;
