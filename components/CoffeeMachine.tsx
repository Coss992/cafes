"use client";

import clsx from "clsx";

type Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
  /** Si pasas <text> u otros nodos SVG como children, se pintan dentro del display */
  children?: React.ReactNode;
  /** Mostrar el cristal del display (aunque no haya número). Default: true */
  showDisplayGlass?: boolean;
};

export default function CoffeeMachine({
  width = 420,
  height = 360,
  className,
  children,
  showDisplayGlass = true,
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 360"
      width={width}
      height={height}
      className={clsx("block h-auto", className)}
    >
      <defs>
        {/* Cuerpo: un poco más oscuro que antes */}
        <linearGradient id="machineBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#DDE2E9" />
          <stop offset="100%" stopColor="#C8CFD9" />
        </linearGradient>
        <linearGradient id="machineEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#9FAAB9" />
          <stop offset="100%" stopColor="#7E8BA0" />
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#EEF2F7" />
          <stop offset="100%" stopColor="#DEE5EE" />
        </linearGradient>
        <linearGradient id="bayInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1A1C20" />
          <stop offset="100%" stopColor="#0C0D10" />
        </linearGradient>
        <linearGradient id="displayGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#233042" />
          <stop offset="100%" stopColor="#0C121B" />
        </linearGradient>
        <linearGradient id="spoutMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#D9DFE6" />
          <stop offset="100%" stopColor="#AEB9C7" />
        </linearGradient>

        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.2" />
        </filter>

        {/* Máscara del panel para recortar el hueco del vaso/bandeja */}
        <mask id="panelMask">
          <rect x="0" y="0" width="420" height="360" fill="#fff" />
          {/* HUECO donde encaja la taza: 150x180, centrado */}
          <rect id="cup-bay" x="135" y="130" width="150" height="180" rx="16" ry="16" fill="#000" />
          {/* ranura bajo el caño */}
          <rect x="198" y="150" width="24" height="6" rx="3" ry="3" fill="#000" />
          {/* NOTA: NO hacemos cutout del display (lo dibujamos por encima para que puedas poner número) */}
        </mask>
      </defs>

      {/* CUERPO DE LA MÁQUINA */}
      <g filter="url(#softShadow)">
        {/* bordes laterales */}
        <rect x="14" y="22" width="392" height="316" rx="24" ry="24" fill="url(#machineEdge)" />
        {/* cara principal con el hueco (mask) */}
        <rect x="24" y="30" width="372" height="300" rx="20" ry="20" fill="url(#machineBody)" mask="url(#panelMask)" />
        {/* fascia superior */}
        <rect x="24" y="30" width="372" height="84" rx="20" ry="20" fill="url(#panel)" />
      </g>

      {/* DISPLAY (sin número por defecto) */}
      <g id="display-window">
        {showDisplayGlass && (
          <>
            <rect
              x="160"
              y="46"
              width="100"
              height="36"
              rx="8"
              ry="8"
              fill="url(#displayGlass)"
              stroke="#1B2130"
              strokeOpacity="0.6"
            />
            {/* brillo sutil */}
            <rect x="166" y="50" width="18" height="28" rx="9" fill="#fff" opacity="0.18" />
          </>
        )}

        {/* Slot para que tú metas el número:
            Coordenadas cómodas: centro (210, 64).
            Ejemplo de uso:
            <text x="210" y="71" textAnchor="middle">42</text> */}
        <g id="display-slot">{children}</g>
      </g>

      {/* BOTONES decorativos */}
      <g opacity="0.9">
        <circle cx="310" cy="64" r="8" fill="#8E9BAA" />
        <circle cx="330" cy="64" r="8" fill="#8E9BAA" />
      </g>

      {/* FONDO del hueco (oscuro para contraste con la taza) */}
      <rect x="135" y="130" width="150" height="180" rx="16" ry="16" fill="url(#bayInner)" />

      {/* BANDEJA/REJILLA */}
      <g opacity="0.9">
        <rect x="145" y="292" width="130" height="8" rx="4" ry="4" fill="#2B2F36" />
        <rect x="150" y="288" width="120" height="4" rx="2" ry="2" fill="#3A404A" />
      </g>

      {/* CAÑO (centrado con el hueco) */}
      <g id="spout">
        <rect x="186" y="112" width="48" height="28" rx="6" ry="6" fill="url(#spoutMetal)" stroke="#9CA7B5" strokeOpacity="0.7" />
        <rect x="202" y="140" width="16" height="16" rx="4" ry="4" fill="url(#spoutMetal)" stroke="#9CA7B5" strokeOpacity="0.7" />
        <rect x="198" y="150" width="24" height="6" rx="3" ry="3" fill="#2B2F36" opacity="0.7" />
      </g>

      {/* CHAPA/LOGO opcional */}
      <rect x="56" y="60" width="54" height="12" rx="6" ry="6" fill="#B8C0CB" opacity="0.85" />
    </svg>
  );
}
