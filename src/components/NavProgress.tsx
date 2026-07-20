"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin coral progress bar across the top of the viewport. Turns on when the
 * URL starts changing, animates to ~85% while the next segment loads, and
 * hides after the pathname settles. Purely a perceived-responsiveness cue —
 * doesn't gate anything.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Whenever the pathname changes, briefly show a "just finished" fill.
    setVisible(true);
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    // Intercept every same-origin link click to kick off the bar immediately.
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!target) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (target.target && target.target !== "_self") return;
      setVisible(true);
      setProgress(15);
      // Ease toward 85% while the next segment loads. Real completion is set
      // by the pathname-change effect above.
      let p = 15;
      const iv = setInterval(() => {
        p = Math.min(85, p + (85 - p) * 0.18);
        setProgress(p);
      }, 120);
      const stop = setTimeout(() => clearInterval(iv), 4000);
      const cleanup = () => { clearInterval(iv); clearTimeout(stop); };
      // If nothing happens in 5s, just hide it — avoid a permanent bar on failed nav.
      setTimeout(() => { setVisible(false); setProgress(0); cleanup(); }, 5000);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #FF6B4A, #FF9F80)",
          boxShadow: "0 0 12px rgba(255,107,74,0.6)",
          transition: "width 0.18s ease",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
