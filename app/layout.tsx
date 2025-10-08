// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Control de Cafés",
  description: "Login",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Evita el hydration mismatch cuando next-themes cambia la clase
    <html
      lang="es"
      className={montserrat.variable}
      suppressHydrationWarning
      // Mantén el colorScheme estable (no genera diff entre server/cliente)
      style={{ colorScheme: "light dark" }}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            expand
            duration={2800}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
