import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBT Market | Token Store",
  description: "Compra CBTokens con tarjeta de crédito de forma fácil y segura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
