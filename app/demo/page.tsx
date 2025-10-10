// app/demo/page.tsx
"use client";

import { useState } from "react";
import { Gamepad2 } from "lucide-react";

type Mode = "WIN" | "LOSE" | "RANDOM";
type Face = "HEADS" | "TAILS";
type CSSVars = React.CSSProperties & Record<string, string | number>;

export default function GamesPlayground() {
  const [busy, setBusy] = useState(false);

  // rotaciones finales (animadas con transition)
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [rz, setRz] = useState(0);

  // para reiniciar keyframes de arco y sombra
  const [tossing, setTossing] = useState(false);

  function launch(mode: Mode) {
  if (busy) return;
  setBusy(true);

  // Resultado deseado
  const wantFace: Face =
    mode === "RANDOM"
      ? Math.random() < 0.5
        ? "HEADS"
        : "TAILS"
      : mode === "WIN"
      ? "HEADS"
      : "TAILS";

  // --- NUEVO: construir el siguiente ángulo siempre hacia delante ---
  const MIN_TURNS = 7;                // mínimo de vueltas completas
  const EXTRA_TURNS = 0 + Math.floor(Math.random() * 3); // +0..2 extra
  const totalTurns = MIN_TURNS + EXTRA_TURNS;

  // ángulo actual (puede ser miles de grados)
  const current = rx;

  // objetivo de cara (0 para HEADS, 180 para TAILS)
  const faceOffset = wantFace === "HEADS" ? 0 : 180;

  // cuánto falta desde el ángulo actual para llegar a esa cara si seguimos girando hacia delante
  const mod = ((current % 360) + 360) % 360; // 0..359
  const deltaToFace = (faceOffset - mod + 360) % 360; // 0..359

  // añadimos vueltas completas por delante
  const nextX = current + deltaToFace + totalTurns * 360;

  // un poquito de variación lateral/roll sin afectar a la sensación de "pocas vueltas"
  const nextY = (Math.random() * 18 - 9) | 0;
  const nextZ = (Math.random() * 16 - 8) | 0;

  // reinicia keyframes y aplica nuevos objetivos
  setTossing(false);
  requestAnimationFrame(() => {
    setTossing(true);
    setRx(nextX);
    setRy(nextY);
    setRz(nextZ);
  });

  // duración fija de la animación (coincide con CSS)
  window.setTimeout(() => setBusy(false), 1600);
}


  const coinVars: CSSVars = {
    "--rx": `${rx}deg`,
    "--ry": `${ry}deg`,
    "--rz": `${rz}deg`,
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="cafe-card mx-auto w-full">
          <div className="flex items-center gap-4 p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white shadow ring-1 ring-black/5">
              <Gamepad2 className="h-7 w-7 text-amber-700" />
            </span>
            <h1 className="cafe-title leading-none text-5xl font-extrabold md:text-6xl">
              GAMES PLAYGROUND
            </h1>
          </div>
        </div>

        {/* Tarjeta del juego */}
        <div className="cafe-card mx-auto w-full p-6 md:p-8">
          <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 md:p-8 relative">
            {/* Escena: sombra fija + arco + moneda */}
            <div className="grid place-items-center my-6">
              <div className="coin-stage">
                {/* Sombra SIEMPRE ABAJO (no rota) */}
                <div className={`coin-shadow-floor ${tossing ? "tossing" : ""}`} />

                {/* Trayectoria + moneda girando */}
                <div className={`coin-arc ${tossing ? "tossing" : ""}`}>
                  <div className="coin" style={coinVars} aria-live="polite">
                    <div className="coin-face coin-front" title="Cara (ganar)">
                      <span aria-hidden>🙂</span>
                    </div>
                    <div className="coin-face coin-back" title="Cruz (perder)">
                      <span aria-hidden>✕</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones: lanzan directamente */}
            <div className="flex items-center justify-center gap-2">
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-white text-sm font-bold shadow hover:bg-emerald-700 disabled:opacity-50"
                onClick={() => launch("WIN")}
                disabled={busy}
                title="Forzar GANAR"
              >
                Ganar
              </button>
              <button
                className="rounded-full bg-rose-600 px-4 py-2 text-white text-sm font-bold shadow hover:bg-rose-700 disabled:opacity-50"
                onClick={() => launch("LOSE")}
                disabled={busy}
                title="Forzar PERDER"
              >
                Perder
              </button>
              <button
                className="rounded-full bg-zinc-900 px-4 py-2 text-white text-sm font-bold shadow hover:bg-black disabled:opacity-50"
                onClick={() => launch("RANDOM")}
                disabled={busy}
                title="50/50 aleatorio"
              >
                50 / 50
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos del coin flip */}
      <style jsx global>{`
        .coin-stage {
          perspective: 1200px;
          width: 260px;
          height: 220px;
          position: relative;
        }

        /* Sombra del suelo independiente (no hereda rotación de la moneda) */
        .coin-shadow-floor {
          position: absolute;
          left: 50%;
          bottom: 4px;
          transform: translateX(-50%) scale(1);
          width: 140px;
          height: 30px;
          border-radius: 9999px;
          background: radial-gradient(80% 80% at 50% 50%, rgba(0, 0, 0, 0.35), transparent 70%);
          filter: blur(2px);
          opacity: 0.6;
          pointer-events: none;
        }
        .coin-shadow-floor.tossing {
          animation: shadowPulse 1.6s ease-out both;
        }
        @keyframes shadowPulse {
          0%   { transform: translateX(-50%) scale(1);   opacity: .65; }
          30%  { transform: translateX(-50%) scale(0.7); opacity: .4;  }
          60%  { transform: translateX(-50%) scale(0.9); opacity: .5;  }
          100% { transform: translateX(-50%) scale(1);   opacity: .65; }
        }

        /* Trayectoria (arco) */
        .coin-arc {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }
        .coin-arc.tossing {
          animation: arcMove 1.6s cubic-bezier(0.2, 0.85, 0.1, 1) both;
        }
        @keyframes arcMove {
          0%   { transform: translateY(0); }
          25%  { transform: translateY(-90px); }
          60%  { transform: translateY(-25px); }
          100% { transform: translateY(0); }
        }

        .coin {
          width: 168px;
          height: 168px;
          transform-style: preserve-3d;
          position: relative;
          border-radius: 50%;
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg));
          transition: transform 1.55s cubic-bezier(0.2, 0.85, 0.1, 1);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.18),
            inset 0 2px 0 rgba(255, 255, 255, 0.25);
        }

        .coin-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          backface-visibility: hidden;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 70px;
          user-select: none;
        }
        .coin-front {
          background: radial-gradient(60% 60% at 30% 30%, #ffe08a, #f4b942);
          border: 2px solid #b07818;
        }
        .coin-back {
          background: radial-gradient(60% 60% at 30% 30%, #e7e7e7, #cfcfcf);
          border: 2px solid #8b8b8b;
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  );
}
