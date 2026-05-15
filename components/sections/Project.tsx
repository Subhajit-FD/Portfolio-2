"use client";

import { Canvas } from "@react-three/fiber";
import CarouselScene from "../custom/carousel-scene";
import { useRef, useState } from "react";
import PreviewGrid from "../custom/preview-grid";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

export default function Project() {
  const [activePreview, setActivePreview] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0);

  // Pin the section and drive carousel rotation via scroll progress
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          scrollProgress.current = self.progress;
        },
      });
    },
    { scope: sectionRef },
  );

  const handleClick = () => {
    const split = new SplitText(titleRef.current, {
      type: "chars",
      charsClass: "char",
    });

    gsap.set(split.chars, {
      display: "inline-block",
    });

    const tl = gsap.timeline({
      onComplete: () => {
        split.revert();
        setActivePreview(true);
      },
    });

    tl.to(split.chars, {
      xPercent: -40,
      opacity: 0,
      stagger: 0.015,
      duration: 0.4,
      ease: "power2.inOut",
    });
  };

  return (
    <div ref={sectionRef} className="relative h-screen">
      {/* Canvas stays pinned within the section */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 18], fov: 50 }}
            style={{ pointerEvents: "auto" }}
          >
            <CarouselScene
              activePreview={activePreview}
              scrollProgress={scrollProgress}
            />
          </Canvas>
        </div>

        <div className="relative z-10 flex h-full w-full items-center justify-center text-center">
          <h1
            ref={titleRef}
            onClick={handleClick}
            className="text-6xl text-white uppercase font-mono mix-blend-difference cursor-pointer"
          >
            Recent Works
          </h1>
        </div>
      </div>

      <PreviewGrid
        isOpen={activePreview}
        onClose={() => setActivePreview(false)}
      />
    </div>
  );
}
