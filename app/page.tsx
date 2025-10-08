"use client";

import { useEffect, useRef, useState } from "react";
import {
  Coffee,
  LogOut,
  History,
  CoffeeIcon,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import CoffeeMachine from "@/components/CoffeeMachine";
import CoffeeMug from "@/components/CoffeeMug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "login" | "placing" | "panel";

type ApiLoginResponse = {
  ok: boolean;
  error?: string;
  user?: { id?: number; login?: string; email?: string };
};

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** POST → registra un consumo (movement_type_id=2, amount=1) vía tu proxy */
async function createMovementTake(userId: number) {
  const res = await fetch("/api/coffee/movements/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      movement_type_id: 2,
      amount: 1,
      bet_id: 0,
    }),
  });
  return { ok: res.ok };
}

/** GET → lee balance_Coffees desde tu proxy /api/coffee/users/[id]/movements */
async function fetchBalance(uid: number): Promise<number | null> {
  try {
    const res = await fetch(`/api/coffee/users/${uid}/movements`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;

    const data: unknown = await res.json().catch(() => null);

    if (
      typeof data === "object" &&
      data !== null &&
      "balance_Coffees" in data
    ) {
      const value = (data as { balance_Coffees: unknown }).balance_Coffees;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }

    return null;
  } catch {
    return null;
  }
}

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [btnMsg, setBtnMsg] = useState<string | null>(null);

  // Datos del usuario
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  // Balance
  const [balance, setBalance] = useState<number>(0);

  const machineRef = useRef<HTMLDivElement>(null);
  const [machineW, setMachineW] = useState(640);

  useEffect(() => {
    const el = machineRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMachineW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ===== Geometría cafetera =====
  const baseW = 420;
  const scale = machineW / baseW;

  const BAY = { x: 135, y: 130, w: 150, h: 180 };
  const SPOUT_CENTER_X = 210;
  const TRAY_TOP_Y = 288;

  // Taza
  const MUG_RATIO = 240 / 300;
  const MUG_SCALE = 1.7;
  const mugWidth = BAY.w * scale * MUG_SCALE;
  const mugHeight = mugWidth * MUG_RATIO;
  const X_ADJ = -8 * scale;
  const Y_ADJ = 53 * scale;

  const targetLeft = SPOUT_CENTER_X * scale - mugWidth / 2 + X_ADJ;
  const targetTop = TRAY_TOP_Y * scale - mugHeight + Y_ADJ;
  const startLeft = machineW + 80;
  const startTop = targetTop;

  // ===== POSICION CAFES =====
  const COUNTER = { x: 215, y: 63 };
  const OFFSET_X = 0;
  const OFFSET_Y = 0;

  // === Chorro ===
  const SPOUT_OUTLET = { x: 210, y: 150 };
  const STREAM_WIDTH = 10;
  const STREAM_ROUND = 9999;
  const STREAM_COLOR = "rgba(92, 54, 31, 0.96)";
  const STREAM_GLOW = "0 6px 16px rgba(92,54,31,.35)";
  const STREAM_LENGTH_FACTOR = 1;
  const STREAM_MAX_PX = 120;

  // Duraciones (ms)
  const DURATION_POUR = 1500;
  const DURATION_EXIT = 800;
  const DURATION_SPAWN = 620;
  const DELAY_RESPAWN = 120;
  const ENTER_MS = 620; // anim entrada

  // Llenado máximo
  const FILL_TARGET = 0.88;

  // Estado anim taza
  const [cupLevel, setCupLevel] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [spawning, setSpawning] = useState(false);
  const [spawnX, setSpawnX] = useState(0);
  const [cupKey, setCupKey] = useState(0);

  // === SHATTER (login fail) ===
  const [shattered, setShattered] = useState(false);
  const [pieces, setPieces] = useState<
    { id: number; dx: number; dy: number; rot: number; delay: number; size: number }[]
  >([]);
  const [piecesGo, setPiecesGo] = useState(false);

  // ===== LOGIN =====
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!username || !password) {
      flashBtn("Tu taza se ha roto");
      triggerShatterCycle();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await readJsonSafe<ApiLoginResponse>(res);

      if (!res.ok || !data?.ok) {
        flashBtn("Tu taza se ha roto");
        setLoading(false);
        triggerShatterCycle();
        return;
      }

      // OK → preparar la taza para que NO parpadee en el destino:
      // 1) dejarla oculta/offscreen
      setPlaced(false);
      // 2) limpiar rotura y trozos
      clearShatter();
      // 3) forzar remount para reiniciar transiciones
      setCupKey((k) => k + 1);
      // 4) cargar datos usuario
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setUserName((data.user?.login || username).toUpperCase());
      if (uid != null) {
        const b = await fetchBalance(uid);
        if (b != null) setBalance(b);
      }
      // 5) modo y arranque de entrada con rAF (ya partimos de placed=false)
      setMode("placing");
      requestAnimationFrame(() => setPlaced(true));

      setTimeout(() => {
        setMode("panel");
        setLoading(false);
      }, ENTER_MS + 30);
    } catch {
      flashBtn("Tu taza se ha roto");
      setLoading(false);
      triggerShatterCycle();
    }
  };

  // Mensaje temporal en el botón
  function flashBtn(msg: string) {
    setBtnMsg(msg);
    setTimeout(() => setBtnMsg(null), 1600);
  }

  // Limpia estado de shatter
  function clearShatter() {
    setShattered(false);
    setPieces([]);
    setPiecesGo(false);
  }

  // Fuerza: 1) reentrada de la taza desde la derecha 2) explosión
  function triggerShatterCycle() {
    clearShatter();
    // re-disparar la animación de entrada previa a explotar
    setPlaced(false);
    requestAnimationFrame(() => setPlaced(true));
    // cuando acabe de entrar, generamos piezas y estallamos
    setTimeout(() => {
      const count = 16;
      const newPieces = Array.from({ length: count }, (_, i) => {
        const spread = mugWidth * 0.8;
        const dx = (Math.random() - 0.5) * spread;
        const dy = (Math.random() * mugHeight * 0.8) - mugHeight * 0.3;
        const rot = (Math.random() - 0.5) * 260;
        const delay = Math.random() * 90;
        const size = 6 + Math.random() * 10;
        return { id: i, dx, dy, rot, delay, size };
      });
      setPieces(newPieces);
      setShattered(true);
      requestAnimationFrame(() => setPiecesGo(true));
      // no respawn hasta login correcto
    }, ENTER_MS + 20);
  }

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      setPlaced(false);
      setMode("login");
      setPassword("");
      setUserName("");
      setUserId(null);
      setBalance(0);
      setCupLevel(0);
      setPouring(false);
      setExiting(false);
      setSpawning(false);
      clearShatter();
    } catch {
      toast.error("No se pudo cerrar sesión.");
    } finally {
      setLoading(false);
    }
  };

  // Colores del número según balance
  const balanceColor = balance <= 0 ? "#ef4444" : "#10b981";

  // Chorro
  const streamLeft = SPOUT_OUTLET.x * scale - (STREAM_WIDTH * scale) / 2;
  const streamTop = SPOUT_OUTLET.y * scale;
  const liquidTopPx = targetTop + mugHeight * (1 - cupLevel);
  const rawHeight = Math.max(6, liquidTopPx - streamTop);
  const heightWithFactor = rawHeight * STREAM_LENGTH_FACTOR;
  const streamHeight = Math.min(heightWithFactor, STREAM_MAX_PX * scale);
  const visibleStream = pouring && !exiting && liquidTopPx > streamTop + 6 * scale;

  // Transforms taza
  const baseDx = targetLeft - startLeft;
  const baseDy = targetTop - startTop;

  function cupTranslate(): string {
    if (exiting) return `translate(${baseDx - 160}px, ${baseDy}px)`;
    if (spawning) return `translate(${spawnX}px, ${baseDy}px)`;
    if (!placed) return `translate(0px, ${baseDy}px)`;
    return `translate(${baseDx}px, ${baseDy}px)`;
  }
  function cupTransition(): string | undefined {
    const active = placed || exiting || spawning;
    return active
      ? `transform ${
          exiting ? DURATION_EXIT : spawning ? DURATION_SPAWN : ENTER_MS
        }ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease`
      : undefined;
  }

  // Tomar café
  const handleBrew = async () => {
    if (pouring || exiting || spawning) return;
    if (!userId) return;

    try {
      const { ok } = await createMovementTake(userId);
      if (!ok) return;
    } catch {
      return;
    }

    const b = await fetchBalance(userId);
    if (b != null) setBalance(b);
    else setBalance((prev) => prev - 1);

    setPouring(true);
    const start = performance.now();
    const from = 0;
    const to = FILL_TARGET;

    const step = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION_POUR);
      const eased = 1 - Math.pow(1 - p, 2);
      setCupLevel(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else {
        setPouring(false);
        setExiting(true);
        setTimeout(() => {
          setCupLevel(0);
          setExiting(false);
          setCupKey((k) => k + 1);
          setSpawning(true);
          setSpawnX(0);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setSpawnX(targetLeft - startLeft));
          });
          setTimeout(() => setSpawning(false), DURATION_SPAWN + 50);
        }, DURATION_EXIT + DELAY_RESPAWN);
      }
    };
    requestAnimationFrame(step);
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="cafe-card mx-auto w-full">
          <div className="flex items-center justify-center gap-4 p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white shadow ring-1 ring-black/5">
              <Coffee className="h-7 w-7 text-amber-700" />
            </span>
            <h1 className="cafe-title leading-none text-5xl font-extrabold md:text-6xl">
              CONTROL DE CAFÉS
            </h1>
          </div>
        </div>

        {/* Panel */}
        <div className="cafe-card mx-auto w-full p-6 md:p-8">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Máquina */}
            <div className="mx-auto w-full max-w-[760px]">
              <div ref={machineRef} className="relative mx-auto w-full max-w-[720px]">
                <CoffeeMachine className="w-full" />

                {/* TAZA normal (si no está rota) */}
                {!shattered && (
                  <div
                    key={cupKey}
                    className="absolute pointer-events-none"
                    style={{
                      width: mugWidth,
                      left: startLeft,
                      top: startTop,
                      opacity: placed ? 1 : 0,
                      transition: placed ? "opacity 150ms ease-out" : undefined,
                    }}
                  >
                    <div
                      className="relative pointer-events-none"
                      style={{
                        transform: cupTranslate(),
                        transition: cupTransition(),
                        opacity: exiting ? 0 : 1,
                      }}
                    >
                      <CoffeeMug level={cupLevel} className="w-full" />
                    </div>
                  </div>
                )}

                {/* SHATTER (solo en fallo de login) */}
                {shattered && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: startLeft,
                      top: startTop,
                      width: mugWidth,
                      height: mugHeight,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        transform: `translate(${targetLeft - startLeft}px, ${targetTop - startTop}px)`,
                        width: mugWidth,
                        height: mugHeight,
                      }}
                    >
                      {pieces.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            position: "absolute",
                            left: mugWidth * 0.5 - p.size / 2,
                            top: mugHeight * 0.55 - p.size / 2,
                            width: p.size,
                            height: p.size,
                            background: "linear-gradient(180deg, #fafafa, #ddd)",
                            border: "1px solid rgba(0,0,0,.12)",
                            borderRadius: 2,
                            boxShadow: "0 6px 14px rgba(0,0,0,.25)",
                            transform: piecesGo
                              ? `translate(${p.dx}px, ${p.dy}px) rotate(${p.rot}deg) scale(0.9)`
                              : "translate(0,0) rotate(0deg) scale(1)",
                            opacity: piecesGo ? 0 : 1,
                            transition: `transform 520ms cubic-bezier(.2,.9,.25,1), opacity 620ms ease`,
                            transitionDelay: `${p.delay}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Chorro */}
                {visibleStream && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: streamLeft,
                      top: SPOUT_OUTLET.y * scale,
                      width: STREAM_WIDTH * scale,
                      height: streamHeight,
                      background: STREAM_COLOR,
                      borderRadius: STREAM_ROUND,
                      boxShadow: STREAM_GLOW,
                      transition: "height 80ms linear",
                    }}
                  />
                )}

                {/* POSICION CAFES (solo número) */}
                {mode === "panel" && (
                  <div
                    className="absolute select-none pointer-events-none"
                    style={{
                      left: COUNTER.x * scale + OFFSET_X,
                      top: COUNTER.y * scale + OFFSET_Y,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span
                      style={{
                        color: balanceColor,
                        fontWeight: 900,
                        fontSize: Math.max(14, 18 * scale),
                        letterSpacing: ".04em",
                        textShadow:
                          "0 2px 6px rgba(0,0,0,.35), 0 0 1px rgba(0,0,0,.6)",
                        WebkitTextStrokeWidth: 0.6,
                        WebkitTextStrokeColor: "rgba(0,0,0,.25)",
                      }}
                      title="Cafés disponibles"
                    >
                      {balance ?? 0}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            {mode !== "panel" ? (
              <form
                onSubmit={onSubmit}
                className="mx-auto grid w-full max-w-md content-center gap-5 min-h-[420px]"
              >
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[13px] text-zinc-700">
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="cafe-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[13px] text-zinc-700">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="cafe-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={`cafe-cta w-full ${btnMsg ? "cafe-cta-error" : ""}`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Coffee className="icon h-5 w-5" />
                    {btnMsg ??
                      (mode === "placing"
                        ? "Colocando taza…"
                        : loading
                        ? "Verificando…"
                        : "Colocar taza")}
                  </span>
                </Button>
              </form>
            ) : (
              <div className="mx-auto grid w-full max-w-md content-center gap-6 min-h-[420px]">
                <div className="flex itemscenter justify-between">
                  <h2 className="text-xl font-extrabold text-zinc-800">
                    Cafetera de {userName || "USUARIO"}
                  </h2>

                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="icon" className="rounded-full" title="Historial">
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full"
                      title="Cerrar sesión"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    className="cafe-tile-primary cafe-tile"
                    type="button"
                    onClick={handleBrew}
                    disabled={pouring || exiting || spawning}
                  >
                    <CoffeeIcon className="h-6 w-6" />
                    <span>Tomar</span>
                  </button>

                  <button
                    className="cafe-tile-dark cafe-tile"
                    type="button"
                    onClick={() => toast.info("Recargar (pendiente de implementar)")}
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Recargar</span>
                  </button>

                  <button
                    className="cafe-tile-accent cafe-tile"
                    type="button"
                    onClick={() => toast.info("Apostar (pendiente de implementar)")}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Apostar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
