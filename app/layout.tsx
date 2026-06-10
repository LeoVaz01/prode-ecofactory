import React from "react";

export const metadata = {
  title: "Prode Mundial 2026 — EcoFactory",
  description: "Prode del Mundial 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
