"use client";
import { useEffect } from "react";

/** Marca <html class="js"> y revela cada bloque [data-reveal] una sola vez al entrar en pantalla. */
export function Motion() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      // Lo que ya está en pantalla al cargar no se esconde
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      else io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return null;
}
