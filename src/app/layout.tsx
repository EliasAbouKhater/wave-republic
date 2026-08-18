import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { NavProgress } from "@/components/NavProgress";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// Without this, phones assume a ~980px canvas and zoom out. The customer app is
// capped at 520px so it merely looked small; the backoffice was unusable.
// No `maximumScale`/`userScalable` — pinch-zoom stays available.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // pairs with the env(safe-area-inset-*) padding below
  themeColor: "#0EA5A4",
};

export const metadata: Metadata = {
  title: "Wave Republic",
  description: "Order food and drinks from anywhere in the park.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wave Republic",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavProgress />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
