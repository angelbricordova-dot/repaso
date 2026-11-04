"use client";
import { useEffect } from "react";

/**
 * Capa de movimiento de la landing:
 * - marca <html class="js"> para que las entradas solo se oculten si hay script;
 * - revela cada sección al entrar en pantalla (.in), una sola vez;
 * - la cabecera toma la tinta del capítulo que tiene debajo.
 */
export function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    const header = document.querySelector<HTMLElement>("[data-chapter-header]");
    const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-ink]"));
    const pickInk = () => {
      if (!header) return;
      const probe = header.offsetHeight / 2;
      for (const ch of chapters) {
        const r = ch.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) {
          header.style.color = ch.dataset.ink || "";
          header.dataset.on = ch.dataset.on || "light";
          break;
        }
      }
    };
    pickInk();
    window.addEventListener("scroll", pickInk, { passive: true });
    window.addEventListener("resize", pickInk);
    return () => {
      reveal.disconnect();
      window.removeEventListener("scroll", pickInk);
      window.removeEventListener("resize", pickInk);
    };
  }, []);
  return null;
}
