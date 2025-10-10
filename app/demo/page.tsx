"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee, LogOut, History, CoffeeIcon, RefreshCw, DollarSign } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion"; // ==== ANIM CAPSULES ====
import CoffeeMachine from "@/components/CoffeeMachine";
import CoffeeMug from "@/components/CoffeeMug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ===================== ANIM: CONFIG CAFETERA ===================== */
// ==== ANIM CAPSULES ====
type CSSNum = number | string;
const DOOR = {
  top: "6.2%" as CSSNum,  // ajusta según tu SVG
  left: "50%" as CSSNum,
  width: 120,
  height: 10,
  radius: 8,
  color: "#95a1b2",
  lift: 20,               // cuánto sube la tapa al abrir
  tOpen: 0.28,
  tClose: 0.24,
  ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  shadow: "0 2px 6px rgba(0,0,0,.25)",
  zIndex: 20,            // por delante de la máquina (z-10) y por detrás de la taza (z-30)
};
const CAPSULE = {
  top: "-20%" as CSSNum, // arranca bien arriba
  left: "50%" as CSSNum,
  size: 56,
  drop: 150,            // caída vertical (px)
  tDrop: 0.55,          // duración base
  tDropMin: 0.20,       // mínimo
  rotateMax: 0,         // 0 = recto
  anchor: "center" as "center" | "topleft",
};
const BATCH = {
  gapMsBase: 100,       // pausa base entre cápsulas
  speedup: 0.92,        // 0.92 => cada cápsula un 8% más rápida; ajustable en tiempo real
};
/* ================================================================ */

type Mode = "boot" | "login" | "placing" | "panel";

type ApiLoginResponse = {
  ok: boolean;
  error?: string;
  user?: { id?: number; login?: string; email?: string };
};

type ApiSessionResponse = {
  ok: boolean;
  user?: { id?: number; login?: string } | null;
};

type MovementsResp = { balance_Coffees: number | string };
function isMovementsResp(d: unknown): d is MovementsResp {
  return typeof d === "object" && d !== null && "balance_Coffees" in (d as Record<string, unknown>);
}

type StyleWithVars = React.CSSProperties & { ["--capsule-w"]?: string };

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function createMovementTake(userId: number) {
  const res = await fetch("/api/coffee/movements/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      movement_type_id: 2,
      amount: 1,
      bet_id: null,
    }),
  });
  return { ok: res.ok };
}

async function createRechargeCoffees(userId: number, coffees: number) {
  const res = await fetch("/api/coffee/movements/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      movement_type_id: 1,
      amount: coffees,
      bet_id: null,
    }),
  });
  return { ok: res.ok };
}

async function fetchBalance(uid: number): Promise<number | null> {
  try {
    const res = await fetch(`/api/coffee/users/${uid}/movements`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;

    const data: unknown = await res.json().catch(() => null);
    if (isMovementsResp(data)) {
      const n = Number(data.balance_Coffees);
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

  /* ===== UI ===== */
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [mode, setMode] = useState<Mode>("boot");
  const [btnMsg, setBtnMsg] = useState<string | null>(null);

  // Usuario
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  // Balance
  const [balance, setBalance] = useState<number>(0);

  // Máquina
  const machineRef = useRef<HTMLDivElement>(null);
  const [machineW, setMachineW] = useState(640);

  useEffect(() => {
    const el = machineRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMachineW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Comprobación de sesión al cargar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await readJsonSafe<ApiSessionResponse>(res);
        if (!cancelled && data?.ok && data.user?.id != null) {
          const uid = data.user.id!;
          setUserId(uid);
          setUserName((data.user.login || "").toUpperCase());
          const b = await fetchBalance(uid);
          if (!cancelled && b != null) setBalance(b);
          setPlaced(false);
          requestAnimationFrame(() => setPlaced(true));
          setMode("panel");
          return;
        }
      } catch {}
      if (!cancelled) setMode("login");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== Geometría cafetera ===== */
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

  // Contador cafés
  const COUNTER = { x: 215, y: 63 };
  const OFFSET_X = 0;
  const OFFSET_Y = 0;

  // Chorro
  const SPOUT_OUTLET = { x: 210, y: 150 };
  const STREAM_WIDTH = 10;
  const STREAM_ROUND = 9999;
  const STREAM_COLOR = "rgba(92, 54, 31, 0.96)";
  const STREAM_GLOW = "0 6px 16px rgba(92,54,31,.35)";
  const STREAM_LENGTH_FACTOR = 1;
  const STREAM_MAX_PX = 120;

  // Duraciones taza
  const DURATION_POUR = 1500;
  const DURATION_EXIT = 800;
  const DURATION_SPAWN = 620;
  const DELAY_RESPAWN = 120;
  const ENTER_MS = 620;

  const FILL_TARGET = 0.88;

  // Estado anim taza
  const [cupLevel, setCupLevel] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [spawning, setSpawning] = useState(false);
  const [spawnX, setSpawnX] = useState(0);
  const [cupKey, setCupKey] = useState(0);

  const brewing = pouring || exiting || spawning;

  // SHATTER (login fail)
  const [shattered, setShattered] = useState(false);
  const [pieces, setPieces] = useState<
    { id: number; dx: number; dy: number; rot: number; delay: number; size: number }[]
  >([]);
  const [piecesGo, setPiecesGo] = useState(false);

  /* ===== Recarga (modal / API) ===== */
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeSending, setRechargeSending] = useState(false);
  const [euroInput, setEuroInput] = useState<string>("1.00");
  const euroValid = isValidEuro(euroInput);

  function isValidEuro(v: string): boolean {
    const s = v.replace(",", ".").trim();
    if (!/^\d+(\.\d{0,2})?$/.test(s)) return false;
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) return false;
    return Math.round(n * 2) === n * 2; // múltiplos de 0.50€
  }

  function openRecharge() {
    if (!userId) return;
    setEuroInput("1.00");
    setRechargeOpen(true);
  }
  function closeRecharge() {
    if (rechargeSending) return;
    setRechargeOpen(false);
  }

  /* ===================== ANIM: CONTROLES ===================== */
  // ==== ANIM CAPSULES ====
  const doorControls = useAnimationControls();
  const capsuleControls = useAnimationControls();
  const animRunningRef = useRef(false);

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const dropDuration = (index: number, speedup = BATCH.speedup) =>
    Math.max(CAPSULE.tDropMin, CAPSULE.tDrop * Math.pow(speedup, index));

  async function runCapsuleBatch(count: number) {
    if (animRunningRef.current) return;
    animRunningRef.current = true;
    try {
      // Reset instantáneo
      capsuleControls.stop();
      doorControls.stop();
      capsuleControls.set({ opacity: 0, y: 0, rotate: 0 });

      // Abrir puerta
      await doorControls.start({
        y: -DOOR.lift,
        transition: { duration: DOOR.tOpen, ease: DOOR.ease },
      });

      // Cascada de cápsulas
      const speedup = count > 1 ? BATCH.speedup : 1;
      for (let i = 0; i < count; i++) {
        await capsuleControls.start({
          opacity: 1,
          y: CAPSULE.drop,
          rotate: CAPSULE.rotateMax,
          transition: { duration: dropDuration(i, speedup), ease: "easeIn" },
        });
        // ocultar + volver arriba instantáneo
        capsuleControls.set({ opacity: 0, y: 0, rotate: 0 });

        const gapMs = Math.max(40, BATCH.gapMsBase - i * 4); // leve reducción del gap
        if (i < count - 1 && gapMs > 0) await delay(gapMs);
      }

      // Cerrar puerta
      await doorControls.start({
        y: 0,
        transition: { duration: DOOR.tClose, ease: DOOR.ease },
      });

      // Lista para el siguiente ciclo
      capsuleControls.set({ opacity: 0, y: 0, rotate: 0 });
    } finally {
      animRunningRef.current = false;
    }
  }
  /* =========================================================== */

  async function submitRecharge() {
    if (!userId || !euroValid || rechargeSending) return;
    const euros = Number(euroInput.replace(",", "."));
    const coffees = Math.round(euros * 2);

    // Cierra modal y muestra “en curso”
    setRechargeOpen(false);
    setRechargeSending(true);

    // Dispara animación en paralelo al API
    const animPromise = runCapsuleBatch(coffees);

    try {
      const { ok } = await createRechargeCoffees(userId, coffees);
      if (ok) {
        const b = await fetchBalance(userId);
        if (b != null) setBalance(b);
      }
    } finally {
      // Espera a que la animación termine de cerrar la puerta (sin bloquear si ya terminó)
      await animPromise.catch(() => {});
      setRechargeSending(false);
    }
  }

  /* ===== Login ===== */
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

      setPlaced(false);
      clearShatter();
      setCupKey((k) => k + 1);

      const uid = data.user?.id ?? null;
      setUserId(uid);
      setUserName((data.user?.login || username).toUpperCase());
      if (uid != null) {
        const b = await fetchBalance(uid);
        if (b != null) setBalance(b);
      }

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

  function flashBtn(msg: string) {
    setBtnMsg(msg);
    setTimeout(() => setBtnMsg(null), 1600);
  }
  function clearShatter() {
    setShattered(false);
    setPieces([]);
    setPiecesGo(false);
  }
  function triggerShatterCycle() {
    clearShatter();
    setPlaced(false);
    requestAnimationFrame(() => setPlaced(true));
    setTimeout(() => {
      const count = 16;
      const newPieces = Array.from({ length: count }, (_, i) => {
        const spread = mugWidth * 0.8;
        const dx = (Math.random() - 0.5) * spread;
        const dy = Math.random() * mugHeight * 0.8 - mugHeight * 0.3;
        const rot = (Math.random() - 0.5) * 260;
        const delay = Math.random() * 90;
        const size = 6 + Math.random() * 10;
        return { id: i, dx, dy, rot, delay, size };
      });
      setPieces(newPieces);
      setShattered(true);
      requestAnimationFrame(() => setPiecesGo(true));
    }, ENTER_MS + 20);
  }

  // ==== LOGOUT ====
  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setPlaced(false);
      setMode("login");
      setPassword("");
      setUserName("");
      setUserId(null);
      setBalance(0);

      // Reset taza
      setCupLevel(0);
      setPouring(false);
      setExiting(false);
      setSpawning(false);

      // Reset recarga
      setRechargeOpen(false);
      setRechargeSending(false);

      setLoading(false);
    }
  };

  /* ===== Servir café ===== */
  const streamLeft = SPOUT_OUTLET.x * scale - (STREAM_WIDTH * scale) / 2;
  const liquidTopPx = targetTop + mugHeight * (1 - cupLevel);
  const rawHeight = Math.max(6, liquidTopPx - SPOUT_OUTLET.y * scale);
  const heightWithFactor = rawHeight * STREAM_LENGTH_FACTOR;
  const streamHeight = Math.min(heightWithFactor, STREAM_MAX_PX * scale);
  const visibleStream = pouring && !exiting && liquidTopPx > SPOUT_OUTLET.y * scale + 6 * scale;

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
      ? `transform ${exiting ? DURATION_EXIT : spawning ? DURATION_SPAWN : ENTER_MS
        }ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease`
      : undefined;
  }

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

  const modalStyle: StyleWithVars = { ["--capsule-w"]: `${480}px` };

  // Estado del botón Recargar
  const recharging = rechargeSending;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="cafe-card mx-auto w-full">
          <div className="flex items-center justify-center gap-4 p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white shadow ring-1 ring-black/5">
              <Coffee className="h-7 w-7 text-amber-700" />
            </span>
            <h1 className="cafe-title leading-none text-5xl font-extrabold md:text-6xl">CONTROL DE CAFÉS</h1>
          </div>
        </div>

        {/* Panel */}
        <div className="cafe-card mx-auto w-full p-6 md:p-8">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Máquina */}
            <div className="mx-auto w-full max-w-[760px]">
              <div ref={machineRef} className="relative mx-auto w/full max-w-[720px] overflow-hidden">
                {/* CÁPSULA (detrás de la máquina) */}
                {/* ==== ANIM CAPSULES ==== */}
                <CapsuleLayer controls={useAnimationProxy(capsuleControls)} />

                {/* CAFETERA (en medio) */}
                <div className="relative z-10">
                  <CoffeeMachine className="w-full" />
                </div>

                {/* PUERTA (delante de la máquina, detrás de la taza/chorro) */}
                {/* ==== ANIM CAPSULES ==== */}
                <DoorOverlay controls={useAnimationProxy(doorControls)} />

                {/* Taza (delante) */}
                {!shattered && (
                  <div
                    key={cupKey}
                    className="absolute pointer-events-none z-30"
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

                {/* Shatter delante */}
                {shattered && (
                  <div
                    className="absolute pointer-events-none z-30"
                    style={{ left: startLeft, top: startTop, width: mugWidth, height: mugHeight }}
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
                    className="absolute pointer-events-none z-30"
                    style={{
                      left: streamLeft,
                      top: SPOUT_OUTLET.y * scale,
                      width: STREAM_WIDTH * scale,
                      height: Math.min(
                        Math.max(6, targetTop + mugHeight * (1 - cupLevel) - SPOUT_OUTLET.y * scale),
                        STREAM_MAX_PX * scale
                      ),
                      background: STREAM_COLOR,
                      borderRadius: STREAM_ROUND,
                      boxShadow: STREAM_GLOW,
                      transition: "height 80ms linear",
                    }}
                  />
                )}

                {/* Contador cafés */}
                {mode === "panel" && (
                  <div
                    className="absolute select-none pointer-events-none z-30"
                    style={{
                      left: COUNTER.x * scale + OFFSET_X,
                      top: COUNTER.y * scale + OFFSET_Y,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span
                      style={{
                        color: balance <= 0 ? "#ef4444" : "#10b981",
                        fontWeight: 900,
                        fontSize: Math.max(14, 18 * scale),
                        letterSpacing: ".04em",
                        textShadow: "0 2px 6px rgba(0,0,0,.35), 0 0 1px rgba(0,0,0,.6)",
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
            {mode === "login" ? (
              <form onSubmit={onSubmit} className="mx-auto grid w/full max-w-md content-center gap-5 min-h-[420px]">
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

                <Button type="submit" disabled={loading} className={`cafe-cta w-full ${btnMsg ? "cafe-cta-error" : ""}`}>
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Coffee className="icon h-5 w-5" />
                    {btnMsg ?? (loading ? "Verificando…" : "Colocar taza")}
                  </span>
                </Button>
              </form>
            ) : (
              <div className="mx-auto grid w/full max-w-md content-center gap-6 min-h-[420px]">
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
                  {/* Tomar */}
                  <button
                    className={`cafe-tile cafe-tile-primary ${brewing ? "cafe-tile-brewing" : ""}`}
                    type="button"
                    onClick={handleBrew}
                    disabled={brewing}
                    aria-busy={brewing}
                    title={brewing ? "Preparando…" : "Tomar"}
                  >
                    <CoffeeIcon className={`h-6 w-6 ${brewing ? "brew-wobble" : ""}`} />
                    <span>{brewing ? "Preparando…" : "Tomar"}</span>
                  </button>

                  {/* Recargar */}
                  <button
                    id="btn-recharge"
                    className={`cafe-tile cafe-tile-dark ${recharging ? "cafe-tile-brewing" : ""}`}
                    type="button"
                    onClick={openRecharge}
                    disabled={recharging}
                    aria-busy={recharging}
                    title={recharging ? "Recargando…" : "Recargar"}
                  >
                    <RefreshCw className={`h-6 w-6 ${recharging ? "brew-wobble" : ""}`} />
                    <span>{recharging ? "Recargando…" : "Recargar"}</span>
                  </button>

                  {/* Apostar */}
                  <button className="cafe-tile cafe-tile-accent" type="button" onClick={() => {}}>
                    <DollarSign className="h-6 w-6" />
                    <span>Apostar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal recarga */}
      {rechargeOpen && (
        <>
          <div className="modal-backdrop" onClick={closeRecharge} />
          <div
            role="dialog"
            aria-modal="true"
            className="capsule-modal"
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="capsule-head">¿Cuántos € quieres recargar?</div>

            <div className="capsule-input-wrap">
              <span className="capsule-euro">€</span>
              <input
                inputMode="decimal"
                type="text"
                className="capsule-input"
                value={euroInput}
                onChange={(e) => {
                  let v = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                  const parts = v.split(".");
                  if (parts[1]?.length > 2) v = parts[0] + "." + parts[1].slice(0, 2);
                  setEuroInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && euroValid) submitRecharge();
                  if (e.key === "Escape") closeRecharge();
                }}
                placeholder="0.50"
                disabled={rechargeSending}
              />
            </div>

            {!euroValid && (
              <p className="capsule-help">
                Usa dos decimales y múltiplos de <b>0,50€</b> (0.50, 1.00, 1.50…).
              </p>
            )}

            <div className="capsule-actions">
              <button className="capsule-btn capsule-cancel" onClick={closeRecharge} disabled={rechargeSending}>
                Cancelar
              </button>
              <button
                className="capsule-btn capsule-accept"
                onClick={submitRecharge}
                disabled={!euroValid || rechargeSending}
              >
                {rechargeSending ? "Procesando…" : "Aceptar"}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

/* ===================== SUBCOMPONENTES ANIMACIÓN ===================== */
// Wrapper para poder pasar controls sin perder tipos en inline JSX
function useAnimationProxy<T>(controls: T) { return controls; }

// Puerta
function DoorOverlay({ controls }: { controls: ReturnType<typeof useAnimationControls> }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: DOOR.zIndex }} // configurable
    >
      <motion.div
        className="absolute -translate-x-1/2"
        style={{
          top: DOOR.top,
          left: DOOR.left,
          width: DOOR.width,
          height: DOOR.height,
          borderRadius: DOOR.radius,
          background: DOOR.color,
          boxShadow: DOOR.shadow,
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
        initial={{ y: 0, opacity: 1 }}
        animate={controls}
      />
    </div>
  );
}

// Cápsula
function CapsuleLayer({ controls }: { controls: ReturnType<typeof useAnimationControls> }) {
  const anchorTransform =
    CAPSULE.anchor === "center" ? "translate(-50%, -50%)" : "translate(0, 0)";

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <div
        className="absolute"
        style={{
          top: CAPSULE.top,
          left: CAPSULE.left,
          transform: anchorTransform,  // anclaje estable
        }}
      >
        <motion.svg
          style={{
            width: CAPSULE.size,
            height: CAPSULE.size,
            willChange: "transform, opacity",
          }}
          viewBox="0 0 56 56"
          initial={{ opacity: 0, y: 0, rotate: 0 }}
          animate={controls} // control imperativo (set/start)
          aria-hidden
        >
          <defs>
            <linearGradient id="capBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#303236" />
              <stop offset="100%" stopColor="#0f1012" />
            </linearGradient>
            <linearGradient id="capRim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b7bfc8" />
              <stop offset="100%" stopColor="#e6eaef" />
            </linearGradient>
          </defs>
          <g>
            <ellipse cx="28" cy="10" rx="18" ry="6" fill="url(#capRim)" />
            <rect x="10" y="10" width="36" height="26" rx="12" fill="url(#capBody)" />
            <ellipse cx="28" cy="36" rx="18" ry="6" fill="#0c0d0f" />
          </g>
        </motion.svg>
      </div>
    </div>
  );
}
