export type Outcome = "win" | "lose";
export type OutcomePreset = "win" | "lose" | "random";

export interface GameProps {
  /** Nombre que mostraremos como rival (puramente UI) */
  rivalLabel: string;
  /** Resultado prefijado por backend (o "random"). El usuario puede sobreescribirlo con los botones de test. */
  preset: OutcomePreset;
  /** Callback cuando el juego termina */
  onEnd: (outcome: Outcome) => void;
  /** Opcional: desactivar controles mientras informas al backend, etc. */
  disabled?: boolean;
}
