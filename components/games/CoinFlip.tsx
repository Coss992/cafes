"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameProps, Outcome, OutcomePreset } from "./types";

function pickFromPreset(preset: OutcomePreset): Outcome {
  if (preset === "random") return Math.random() < 0.5 ? "win" : "lose";
  return preset;
}

export default function CoinFlip({ rivalLabel, preset, onEnd, disabled }: GameProps) {
  // preset local que el tester puede forzar con los botones
  const [testerPreset, setTesterPreset] = useState<OutcomePreset | null>(null);

  // cuál preset se usará realmente en el lanzamiento actual
  const effectivePreset = useMemo<OutcomePreset>(
    () => testerPreset ?? preset,
    [testerPreset, preset]
  );

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Outcome | null>(null);

  // Resetea el resultado si cambia el rival o preset externo
  useEffect(() => {
    setResult(null);
    setSpinning(false);
  }, [rivalLabel, preset]);

  const launch = () => {
    if (spinning || disabled) return;
    setResult(null);
    setSpinning(true);

    // Simulación de animación de moneda (1.2s). Aquí puedes meter framer-motion si quieres más flair.
    const outcome = pickFromPreset(effectivePreset);
    setTimeout(() => {
      setSpinning(false);
      setResult(outcome);
      onEnd(outcome);
    }, 1200);
  };

  const faceText = result
    ? result === "win"
      ? "¡Cara!"
      : "¡Cruz!"
    : spinning
    ? "Girando…"
    : "Listo";

  return (
    <div className="grid gap-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">
          Rival: <b>{rivalLabel}</b>
        </div>
        <div className="text-xs font-semibold text-zinc-500">
          Preset: <code>{(testerPreset ?? preset).toUpperCase()}</code>
        </div>
      </div>

      {/* Moneda */}
      <div className="grid place-items-center">
        <div
          aria-live="polite"
          className={[
            "h-28 w-28 rounded-full border-2 border-amber-600 bg-amber-300/70",
            "shadow-[inset_0_10px_20px_rgba(0,0,0,.15),0_10px_20px_rgba(0,0,0,.15)]",
            "grid place-items-center text-lg font-extrabold text-amber-900 select-none",
            spinning ? "animate-[spin_400ms_linear_infinite]" : "",
          ].join(" ")}
        >
          {faceText}
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div
          className={
            "rounded-xl px-3 py-2 text-sm font-bold " +
            (result === "win"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800")
          }
        >
          {result === "win" ? "Has ganado" : "Has perdido"}
        </div>
      )}

      {/* Controles principales */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={launch}
          disabled={spinning || disabled}
          className="capsule-btn capsule-accept disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lanzar moneda
        </button>

        {/* Barra de test */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">Forzar:</span>
          <button
            type="button"
            onClick={() => setTesterPreset("win")}
            className="rounded-full px-3 py-1 text-xs font-bold bg-emerald-600 text-white hover:brightness-105"
          >
            Ganar
          </button>
          <button
            type="button"
            onClick={() => setTesterPreset("lose")}
            className="rounded-full px-3 py-1 text-xs font-bold bg-rose-600 text-white hover:brightness-105"
          >
            Perder
          </button>
          <button
            type="button"
            onClick={() => setTesterPreset("random")}
            className="rounded-full px-3 py-1 text-xs font-bold bg-zinc-800 text-white hover:brightness-105"
          >
            50 / 50
          </button>
          {testerPreset && (
            <button
              type="button"
              onClick={() => setTesterPreset(null)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold border hover:bg-black/5"
              title="Volver al preset del backend"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
