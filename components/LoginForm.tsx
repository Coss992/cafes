"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onStart?: () => void;
  onDone?: () => void;
  redirectTo?: string;
};

export default function LoginForm({ onStart, onDone, redirectTo }: Props) {
  const [email, setEmail] = useState("demo@cafes.app");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  const returnTo = redirectTo ?? params.get("returnTo") ?? "/coffee";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    onStart?.();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      onDone?.();
      router.push(returnTo);
    } else {
      setLoading(false);
      alert("Credenciales inválidas (mock): escribe cualquier usuario y contraseña.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Usuario</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
