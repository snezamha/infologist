import { Inter, Vazirmatn } from "next/font/google";

import { cn } from "@/lib/utils";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const fontVariables = cn(inter.variable, vazir.variable);
