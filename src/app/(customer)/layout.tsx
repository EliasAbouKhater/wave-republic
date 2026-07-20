import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0EA5A4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#EAF7F5" }}
    >
      {children}
    </div>
  );
}
