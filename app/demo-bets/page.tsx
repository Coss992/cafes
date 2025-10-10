// app/demo-bets/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Coffee, DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";

/* ===================== Tipos ===================== */
type ApiUser = {
  id: number;
  login?: string;
  name?: string;
  email?: string;
  status?: { id: number; code: string; name: string };
  role?: { id: number; code: string; name: string };
};

type Rival = { id: number; label: string };
type GameMeta = { key: string; label: string };

/* ===================== Helpers ===================== */
function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ===================== API ===================== */
async function fetchUsersList(params?: {
  name?: string;
  status?: number;
  rol?: number;
  page?: number;
  rowsPerPage?: number;
}): Promise<ApiUser[]> {
  const query = new URLSearchParams();
  const p = { page: 1, rowsPerPage: 200, ...(params || {}) };
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
  });

  // 👉 usa tu route local /api/users/list (proxy o mock)
  const res = await fetch(`/api/users/list?${query.toString()}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("No se pudo cargar la lista de usuarios");
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as ApiUser[]) : [];
}

/* ===================== PAGE ===================== */
export default function DemoBetsPage() {
  const userName = "USUARIO DEMO";

  /* ---------- Estado: modal elegir rival ---------- */
  const [betOpen, setBetOpen] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [rivalId, setRivalId] = useState<number | "">("");

  /* ---------- Estado: juego (placeholder) ---------- */
  const [gameOpen, setGameOpen] = useState(false);
  const [currentRival, setCurrentRival] = useState<Rival | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameMeta | null>(null);

  // Catálogo de juegos (más adelante mapearemos a componentes reales en /components/games)
  const gamePool = useMemo<GameMeta[]>(
    () => [
      { key: "coin", label: "Cara o Cruz" },
      { key: "dice", label: "Dados" },
      { key: "slots", label: "Tragaperras" },
      { key: "roulette", label: "Ruleta" },
    ],
    []
  );

  /* ---------- Abrir modal de apuesta ---------- */
  const openBet = async () => {
    setBetOpen(true);
    setUsers([]);
    setUsersError(null);
    setRivalId("");
    setUsersLoading(true);
    try {
      const list = await fetchUsersList({ page: 1, rowsPerPage: 200 });
      setUsers(list);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setUsersLoading(false);
    }
  };
  const closeBet = () => setBetOpen(false);

  /* ---------- Continuar → abrir modal de juego (placeholder) ---------- */
  const continueToGame = () => {
    if (rivalId === "") return;
    const rivalUser = users.find((u) => u.id === rivalId);
    const rival: Rival = {
      id: Number(rivalId),
      label: rivalUser?.name?.trim() || rivalUser?.login || `Usuario #${rivalId}`,
    };
    setCurrentRival(rival);
    setSelectedGame(randomPick(gamePool));
    setBetOpen(false);
    setGameOpen(true);
  };

  const closeGame = () => setGameOpen(false);

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="cafe-card mx-auto w-full">
          <div className="flex items-center justify-center gap-4 p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white shadow ring-1 ring-black/5">
              <Coffee className="h-7 w-7 text-amber-700" />
            </span>
            <h1 className="cafe-title leading-none text-5xl font-extrabold md:text-6xl">
              CONTROL DE CAFÉS (Demo)
            </h1>
          </div>
        </div>

        {/* Panel simplificado */}
        <div className="cafe-card mx-auto w-full p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 min-h-[260px] grid place-items-center text-zinc-500">
              <p>Placeholder visual de la cafetera</p>
            </div>

            <div className="grid content-center gap-6">
              <h2 className="text-xl font-extrabold text-zinc-800">
                Cafetera de {userName}
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <button className="cafe-tile opacity-50 cursor-not-allowed" type="button" disabled>
                  <span className="h-6 w-6" />
                  <span>Tomar</span>
                </button>
                <button className="cafe-tile opacity-50 cursor-not-allowed" type="button" disabled>
                  <span className="h-6 w-6" />
                  <span>Recargar</span>
                </button>
                <button
                  className="cafe-tile cafe-tile-accent cursor-pointer"
                  type="button"
                  onClick={openBet}
                  title="Apostar"
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Apostar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========= MODAL 1: Elegir rival ========= */}
      {betOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeBet} />
          <div className="absolute inset-0 grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
            <div
              className="w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl text-zinc-800" /* <-- texto oscuro */
              style={{
                background:
                  "radial-gradient(120% 120% at 20% -10%, rgba(255,255,255,.45), transparent 60%), linear-gradient(180deg, #f8f7f3, #f2eee8 60%, #ece6de)",
                border: "1px solid color-mix(in oklch, #f4eee6 68%, black 0%)",
              }}
            >
              <div className="flex items-center justify-end mb-2">
                <button
                  type="button"
                  onClick={closeBet}
                  className="rounded-full px-3 py-1 text-sm font-bold hover:bg-black/5"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-extrabold text-zinc-900 mb-2">¿Contra quién quieres apostar?</h3>
              <p className="text-sm text-zinc-700 mb-4">
                Elige un rival de la lista.
              </p>

              <div className="space-y-2 mb-6">
                <Label htmlFor="rival" className="text-[13px] text-zinc-700">Rival</Label>
                <select
                  id="rival"
                  className="w-full h-12 rounded-xl border border-zinc-200 bg-white px-3 text-[15px] font-semibold
                             focus:outline-none focus:ring-4 focus:ring-amber-300/40 text-zinc-800" /* <-- texto del select */
                  value={rivalId}
                  onChange={(e) => setRivalId(e.target.value ? Number(e.target.value) : "")}
                  disabled={usersLoading}
                >
                  <option value="">{usersLoading ? "Cargando usuarios…" : "Selecciona un usuario…"}</option>
                  {usersError && <option value="" disabled>⚠ {usersError}</option>}
                  {!usersLoading &&
                    !usersError &&
                    users.map((u) => {
                      const label = u.name?.trim() || u.login || `Usuario #${u.id}`;
                      return (
                        <option key={u.id} value={u.id}>
                          {label}
                        </option>
                      );
                    })}
                </select>
                {usersError && <p className="text-sm text-red-600">No se pudo cargar la lista. Reintenta más tarde.</p>}
              </div>

              <div className="flex justify-end gap-2">
                <button className="capsule-btn capsule-cancel" onClick={closeBet} type="button">
                  Cancelar
                </button>
                <button
                  className="capsule-btn capsule-accept disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={rivalId === "" || !!usersError}
                  onClick={continueToGame}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========= MODAL 2: Placeholder del juego ========= */}
      {gameOpen && currentRival && selectedGame && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeGame} />
          <div className="absolute inset-0 grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
            <div
              className="w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl text-zinc-800" /* <-- texto oscuro */
              style={{
                background:
                  "radial-gradient(120% 120% at 20% -10%, rgba(255,255,255,.45), transparent 60%), linear-gradient(180deg, #f8f7f3, #f2eee8 60%, #ece6de)",
                border: "1px solid color-mix(in oklch, #f4eee6 68%, black 0%)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-extrabold text-zinc-900">Mini-juego</h3>
                <button
                  type="button"
                  onClick={closeGame}
                  className="rounded-full px-3 py-1 text-sm font-bold hover:bg-black/5"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Placeholder: aquí montaremos el componente real desde /components/games/* */}
              <div className="space-y-3">
                <p className="text-sm text-zinc-700">
                  Rival: <b>{currentRival.label}</b>
                </p>
                <div className="rounded-2xl border bg-white p-6 text-center">
                  <p className="font-bold">
                    Aquí cargaremos el componente del juego:{" "}
                    <span className="underline">{selectedGame.label}</span>
                  </p>
                  <p className="text-sm text-zinc-600 mt-2">
                    Cuando estén listos, importaremos el componente desde <code>/components/games/{'{nombre}'}</code>.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button className="capsule-btn capsule-accept" onClick={closeGame}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
