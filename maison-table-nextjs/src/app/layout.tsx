import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison Table — Seasonal kitchen & delivery",
  description: "Order seasonal, fire-cooked dishes from Maison Table for delivery.",
  openGraph: {
    title: "Maison Table",
    description: "Seasonal kitchen & wine bar — order online.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster position="bottom-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
