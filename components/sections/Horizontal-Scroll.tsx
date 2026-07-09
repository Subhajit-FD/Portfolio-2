"use client";
import React, { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SVGs = [
  {
    viewBox: "0 0 289 44",
    path: "M1 14.2838C25.5 7.6171 117.2 -3.91624 288 3.28376C225.167 6.95057 98.6 15.2842 95 19.2842C90.5 24.2842 148.5 20.7842 162.5 24.7842C173.7 27.9842 148.833 38.1175 135 42.7842",
  },
  {
    viewBox: "0 0 194 32",
    path: "M1.00242 28.7625C19.1218 29.5622 37.1981 31.1788 55.3704 30.9773C70.3695 30.7929 85.3035 30.3409 100.019 27.0238C124.314 18.4355 120.163 9.96729 116.314 6.27603C109.948 0.179417 94.0642 -0.347054 86.5554 4.17028C80.795 7.61752 80.0971 13.8162 85.0079 18.4355C101.813 30.9773 179.249 28.0169 192.553 25.8934L192.554 25.867",
  },
  {
    viewBox: "0 0 257 115",
    path: "M49 113.5C64.5 113.5 134.948 103.372 147.958 99.942C175.168 92.762 201.658 83.622 226.488 70.172C235.228 65.442 243.548 60.022 249.798 52.082C258.338 41.232 257.068 30.232 246.298 21.562C236.938 14.032 225.838 10.292 214.368 7.59197C192.568 2.46197 170.438 1.24198 148.098 2.01198C128.808 2.68198 109.728 4.81196 90.8277 8.65196C69.5577 12.972 48.8577 19.032 29.6777 29.472C20.8277 34.282 12.6877 40.052 6.76771 48.412C-2.47229 61.442 -0.482289 75.872 11.8177 85.962C19.3977 92.182 28.2977 95.812 37.4477 98.922C48.2877 102.602 59.4477 105.042 70.6177 107.672L114 113.5",
  },
];

const HorizontalScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const text1 = "I Craft digital experience as a designer,";
  const text2 = "And build them as a developer";

  const splitChars1 = useMemo(() => text1.split(""), [text1]);
  const splitChars2 = useMemo(() => text2.split(""), [text2]);

  const SVGElements = useMemo(() => {
    return [
      {
        ...SVGs[0],
        top: "10%",
        left: "25%",
        rotation: -5,
        width: "clamp(240px, 15vw, 300px)", // Larger and responsive
      },
      {
        ...SVGs[1],
        top: "75%",
        left: "55%",
        rotation: 2,
        width: "clamp(240px, 20vw, 400px)", // Larger and responsive
      },
      {
        ...SVGs[2],
        top: "15%",
        left: "86%",
        rotation: 10,
        width: "clamp(240px, 18vw, 350px)", // Larger and responsive
      },
    ].map((svg, i) => ({ ...svg, id: i }));
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || !textRef.current) return;

      const textWidth = textRef.current.offsetWidth;
      const amountToScroll = textWidth - window.innerWidth + 200;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${amountToScroll}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Horizontal movement
      tl.to(textRef.current, {
        x: -amountToScroll,
        duration: 2,
        ease: "none",
      }, 0);

      // 2. Character entrance (fast and smooth)
      const chars = gsap.utils.toArray<HTMLElement>(".char-inner");
      tl.fromTo(chars, 
        { 
          y: (i) => (i % 2 !== 0 ? "105%" : "-105%") 
        },
        { 
          y: "0%", 
          stagger: {
            each: 0.2 / chars.length, // Fast stagger for responsive feel
            from: "start",
          },
          ease: "power2.out",
          duration: 0.3,
        },
        0 
      );

      // 3. SVG Drawing (Sync with scroll)
      const paths = gsap.utils.toArray<SVGPathElement>(".svg-path");
      paths.forEach((path, i) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        
        // Appear earlier and draw faster
        const pos = [0.35, 0.95, 1.55][i];
        tl.to(path, {
          strokeDashoffset: 0,
          duration: 0.15, // Speedy drawing
          ease: "none",
        }, pos);
      });
    },
    { scope: containerRef }
  );

  const renderSplitText = (chars: string[]) => {
    return chars.map((char, i) => (
      <span key={i} className="char relative inline-block overflow-hidden pb-[0.2em] -mb-[0.2em]">
        <span className="char-inner inline-block">
          {char === " " ? "\u00A0" : char}
        </span>
      </span>
    ));
  };

  return (
    <section 
      ref={containerRef} 
      className="relative h-auto overflow-hidden bg-background"
    >
      <div className="flex items-center min-h-screen overflow-hidden relative">
        <h2 
          ref={textRef}
          className="uppercase text-9xl font-heading font-bold whitespace-nowrap leading-none pl-[150vw] pr-[20vw] md:pl-[80vw] md:pr-[10vw] flex items-center gap-[15vw] relative pointer-events-none z-20"
        >
          <div className="flex items-baseline relative">
            {renderSplitText(splitChars1)}
            <span className="w-[10vw] inline-block" />
            {renderSplitText(splitChars2)}
          </div>

          {SVGElements.map((svg) => (
            <div
              key={svg.id}
              className="absolute pointer-events-none"
              style={{
                top: svg.top,
                left: svg.left,
                width: svg.width,
                transform: `rotate(${svg.rotation}deg)`,
                zIndex: 10,
              }}
            >
              <svg width="100%" height="auto" viewBox={svg.viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  className="svg-path"
                  d={svg.path}
                  stroke="#FF4925"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}
        </h2>
      </div>
    </section>
  );
};

export default HorizontalScroll;