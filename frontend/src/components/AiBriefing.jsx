import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Volume2, VolumeX, Radio, Loader2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PERSONAS = ["FLIGHT DIRECTOR", "FIELD GEOLOGIST", "RISK OFFICER"];

const AiBriefing = ({ origin, plan }) => {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    setText("");
    window.speechSynthesis?.cancel();
  }, [plan]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [text]);

  useEffect(() => {
    if (audioOn && !streaming && text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.96;
      utter.pitch = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
    if (!audioOn) window.speechSynthesis?.cancel();
  }, [audioOn, streaming]);

  const generate = async () => {
    if (!plan) {
      toast.error("Calculate a route first — the narrator needs mission data.");
      return;
    }
    setStreaming(true);
    setText("");
    window.speechSynthesis?.cancel();
    try {
      const res = await fetch(`${API}/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, origin: plan.origin, plan }),
      });
      if (!res.ok || !res.body) throw new Error("uplink failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6);
          if (payload === "[DONE]") break;
          setText((t) => t + JSON.parse(payload));
        }
      }
    } catch (e) {
      toast.error("Briefing uplink failed.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <Reveal delay={0.1}>
      <div data-testid="ai-briefing-card" className="hud-glass scanlines relative flex h-full flex-col rounded-xl p-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono-hud mb-2 text-[10px] tracking-[0.35em] text-[#F59E0B]">
              TACTICAL ADVISORY UPLINK
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-slate-50">
              AI Mission Briefing
            </h3>
          </div>
          <Radio className={`h-6 w-6 ${streaming ? "animate-pulse text-[#F59E0B]" : "text-[#E25B38]"}`} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <button
              key={p}
              data-testid={`ai-briefing-persona-${p.toLowerCase().replace(" ", "-")}`}
              onClick={() => setPersona(p)}
              className={`font-mono-hud rounded-full border px-4 py-1.5 text-[10px] tracking-[0.25em] transition-colors duration-300 ${
                persona === p
                  ? "border-[#E25B38] bg-[#E25B38]/15 text-[#E25B38]"
                  : "border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div
          ref={boxRef}
          data-testid="ai-briefing-text"
          className="font-mono-hud mb-5 min-h-[220px] flex-1 overflow-y-auto rounded-lg border border-white/10 bg-[#07090E] p-5 text-[13px] leading-relaxed tracking-wide text-emerald-300/90"
        >
          {text ? (
            <>
              {text}
              {streaming && <span className="animate-cursor-blink ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-emerald-400" />}
            </>
          ) : (
            <span className="text-slate-600">
              {streaming
                ? `ESTABLISHING UPLINK · ${persona} ON CHANNEL…`
                : "// NO BRIEFING GENERATED. COMPUTE A ROUTE, THEN REQUEST ADVISORY."}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="ai-briefing-generate-button"
            onClick={generate}
            disabled={streaming}
            className="font-mono-hud flex-1 border border-[#F59E0B]/60 px-6 py-3 text-xs font-bold tracking-[0.25em] text-[#F59E0B] transition-colors duration-300 hover:bg-[#F59E0B] hover:text-[#07090E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {streaming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> RECEIVING…
              </span>
            ) : (
              "GENERATE BRIEFING"
            )}
          </button>
          <button
            data-testid="ai-briefing-audio-toggle"
            onClick={() => setAudioOn((a) => !a)}
            aria-label="Toggle voice readout"
            className={`font-mono-hud rounded-lg border p-3 transition-colors duration-300 ${
              audioOn ? "border-emerald-400/60 text-emerald-400" : "border-white/10 text-slate-500 hover:text-slate-300"
            }`}
          >
            {audioOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Reveal>
  );
};

export default AiBriefing;
