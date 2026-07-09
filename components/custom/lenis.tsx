"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

const ScrollTriggerSync = () => {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    lenis.on("scroll", ScrollTrigger.update);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
    };
  }, [lenis]);

  return null;
};

const LenisSmoothScroll = () => {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        duration: 1.2,
        touchMultiplier: 2,
        smoothWheel: true,
      }}
      ref={lenisRef}
    >
      <ScrollTriggerSync />
    </ReactLenis>
  );
};

export default LenisSmoothScroll;