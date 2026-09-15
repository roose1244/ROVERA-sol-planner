const ITEMS = [
  "ORBITAL VELOCITY 24.077 KM/S",
  "SOL LENGTH 24H 39M 35S",
  "ATMOSPHERE 95.3% CO₂",
  "SURFACE GRAVITY 3.71 M/S²",
  "MEAN TEMP −63°C",
  "NEXT LAUNCH WINDOW 212 SOLS",
  "WATER-ICE CONFIDENCE 98% · KOROLEV",
  "DUST SEASON APPROACHING · LS 270°",
];

const Marquee = () => {
  const strip = [...ITEMS, ...ITEMS];
  return (
    <div
      data-testid="editorial-marquee-strip"
      className="relative overflow-hidden border-y border-white/10 bg-[#0A0D14] py-5"
    >
      <div className="animate-marquee flex w-max items-center whitespace-nowrap">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center">
            {strip.map((item, i) => (
              <span
                key={`${half}-${i}`}
                className="font-mono-hud flex items-center text-xs tracking-[0.35em] text-slate-600"
              >
                <span className="px-8">{item}</span>
                <span className="text-[#E25B38]/50">//</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
