"use client";

import clsx from "clsx";

type Props = {
  level?: number;        // 0..1
  className?: string;
  waves?: boolean;       // olas solo si hay café
};

export default function CoffeeMug({ level = 0.5, className, waves = true }: Props) {
  const inner = { x: 102, y: 36, w: 116, h: 128 };
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const l = clamp(level);

  const coffeeHeight = inner.h * l;
  const coffeeY = inner.y + inner.h - coffeeHeight;
  const cremaH = 8;
  const cremaY = coffeeY - cremaH;
  const hasCoffee = l > 0.001;
  const deltaFromBase = coffeeY - 100; // para reposicionar “olas” respecto al 50%

  return (
    <div className={clsx("mx-auto w-[300px]", className)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" className="w-full h-auto">
        <defs>
          {/* cristal */}
          <linearGradient id="glassFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".96" />
            <stop offset="100%" stopColor="#f3f4f6" stopOpacity=".86" />
          </linearGradient>
          <linearGradient id="glassStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101114" stopOpacity=".9" />
            <stop offset="100%" stopColor="#101114" stopOpacity=".7" />
          </linearGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity=".6" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>

          {/* asa blanca con brillo */}
          <linearGradient id="handleStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9eef5" />
          </linearGradient>

          {/* café + crema */}
          <linearGradient id="coffee" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3c241a" />
            <stop offset="100%" stopColor="#6b3e2e" />
          </linearGradient>
          <linearGradient id="crema" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7a866" />
            <stop offset="100%" stopColor="#b98345" />
          </linearGradient>

          <clipPath id="innerClip">
            <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx="20" ry="20" />
          </clipPath>
        </defs>

        {/* sombra */}
        <ellipse cx="160" cy="196" rx="70" ry="10" fill="#000" opacity=".08" />

        {/* ASA con gradiente + highlight fino */}
        <path
          d="M230,82 a30,30 0 1,1 0,76"
          fill="none"
          stroke="url(#handleStroke)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity=".98"
        />
        {/* highlight interior de la asa */}
        <path
          d="M230,86 a26,26 0 1,1 0,68"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".35"
        />

        {/* cuerpo del vaso */}
        <rect
          x="90"
          y="24"
          width="140"
          height="152"
          rx="26"
          ry="26"
          fill="url(#glassFill)"
          stroke="url(#glassStroke)"
          strokeWidth="10"
        />
        {/* brillo vertical */}
        <rect x="104" y="40" width="18" height="128" rx="9" fill="url(#shine)" opacity=".55" />

        {/* contenido */}
        <g clipPath="url(#innerClip)">
          {hasCoffee && (
            <>
              <rect x={inner.x} y={coffeeY} width={inner.w} height={coffeeHeight} fill="url(#coffee)" />
              <rect x={inner.x} y={cremaY} width={inner.w} height={cremaH} fill="url(#crema)" />
              {waves && (
                <>
                  <path
                    d={`M102,${108 + deltaFromBase} c18,5 36,-5 54,0 s36,5 62,0 v12 h-116 z`}
                    fill="#000"
                    opacity=".10"
                  />
                  <path
                    d={`M102,${104 + deltaFromBase} c18,-5 36,5 54,0 s36,-5 62,0 v9 h-116 z`}
                    fill="#2a1712"
                    opacity=".15"
                  />
                </>
              )}
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
