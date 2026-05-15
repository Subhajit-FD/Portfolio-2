"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const gridImages = [
  { src: "/images/img1.webp", title: "Kai Vega" },
  { src: "/images/img2.webp", title: "Riven Juno" },
  { src: "/images/img3.webp", title: "Lex Orion" },
  { src: "/images/img4.webp", title: "Ash Kairos" },
];

interface PreviewGridProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewGrid({ isOpen, onClose }: PreviewGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  useGSAP(() => {
    const items = itemsRef.current.filter(Boolean) as HTMLElement[];
    if (!containerRef.current || !items.length) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const itemData = items.map((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = centerX - cx;
      const dy = centerY - cy;
      const dist = Math.hypot(dx, dy);

      return {
        el,
        dx,
        dy,
        dist,
        isLeft: cx < centerX,
      };
    });

    const maxDist = Math.max(...itemData.map((d) => d.dist));
    const totalStagger = 0.04 * (itemData.length - 1);

    // MASTER TIMELINE
    const tl = gsap.timeline();

    if (isOpen) {
      tl.set(containerRef.current, {
        autoAlpha: 1,
        pointerEvents: "auto",
      });

      tl.delay(2.5); // sync with 3D

      itemData.forEach(({ el, dx, dy, dist, isLeft }) => {
        const norm = maxDist ? dist / maxDist : 0;

        const delay = Math.pow(1 - norm, 2.5) * totalStagger;
        const rotationY = isLeft ? 90 : -90;

        // Depth
        tl.fromTo(
          el,
          { z: -2500 },
          {
            z: 0,
            duration: 0.5,
            ease: "power4.out",
          },
          delay
        );

        // Main motion
        tl.fromTo(
          el,
          {
            transformOrigin: `50% 50% ${dx * -0.6}px`,
            autoAlpha: 0,
            y: dy * 0.6,
            scale: 0.6,
            rotationY,
          },
          {
            y: 0,
            scale: 1,
            rotationY: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          delay
        );
      });
    } else {
      itemData.forEach(({ el, dx, dy, dist, isLeft }) => {
        const norm = maxDist ? dist / maxDist : 0;

        const delay = Math.pow(norm, 1.8) * totalStagger;
        const rotationY = isLeft ? 90 : -90;

        tl.to(
          el,
          {
            y: dy * 0.4,
            rotationY,
            scale: 0.5,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power3.in",
          },
          delay
        );

        tl.to(
          el,
          {
            z: -2500,
            duration: 0.4,
            ease: "power4.in",
          },
          delay + 0.05
        );
      });

      tl.set(containerRef.current, {
        autoAlpha: 0,
        pointerEvents: "none",
      }, "+=0.6");
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 px-[15vw] pt-20 pb-10 overflow-y-auto bg-[#0f0e0e] opacity-0 pointer-events-none"
    >
      <header className="flex justify-between mb-8">
        <h2 className="text-2xl text-white font-mono uppercase">
          Recent Works
        </h2>

        <button onClick={onClose} className="text-white uppercase font-mono">
          Close ×
        </button>
      </header>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-12 perspective-[900px]">
        {gridImages.map((item, i) => (
          <figure
            key={i}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="transform-3d"
          >
            <div
              className="aspect-[4/5] bg-cover bg-center"
              style={{ backgroundImage: `url(${item.src})` }}
            />
            <figcaption className="text-white font-mono mt-2 uppercase">
              {item.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}