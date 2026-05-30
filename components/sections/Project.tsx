"use client";

import { Canvas } from "@react-three/fiber";
import CarouselScene from "../custom/carousel-scene";
import { useRef, useState, useEffect, useMemo } from "react";
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

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/projects", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((e) => console.error("Error fetching projects:", e));
  }, []);

  const carouselProjects = useMemo(() => {
    const featured = projects.filter((p) => p.featured);
    if (featured.length = 4) {
      return featured.slice(0, 4);
    }
    const nonFeatured = projects.filter((p) => !p.featured);
    return [...featured, ...nonFeatured].slice(0, 4);
  }, [projects]);

  return (
    <div ref={sectionRef} className="relative h-screen">
      {/* Canvas stays pinned within the section */}
      <div className="absolute inset-0">
        {/* Canvas container capturing click to trigger zoom */}
        <div 
          onClick={handleClick}
          className="absolute inset-0 z-10 cursor-pointer"
        >
          <Canvas
            camera={{ position: [0, 0, 18], fov: 50 }}
            style={{ pointerEvents: "auto" }}
          >
            <CarouselScene
              activePreview={activePreview}
              scrollProgress={scrollProgress}
              projects={carouselProjects}
              titleRef={titleRef}
            />
          </Canvas>
        </div>
      </div>

      <PreviewGrid
        isOpen={activePreview}
        onClose={() => setActivePreview(false)}
        projects={projects}
      />
    </div>
  );
}
