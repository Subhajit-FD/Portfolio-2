"use client";

import { Canvas } from "@react-three/fiber";
import CarouselScene from "../custom/carousel-scene";
import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ProjectItem {
  _id: string;
  title: string;
  liveUrl?: string;
  githubUrl?: string;
  mobileImage?: string;
  desktopImage?: string;
  featured: boolean;
  createdAt: string;
}

export default function Project() {
  const router = useRouter();
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
    const chars = gsap.utils.toArray<HTMLElement>(".title-char");
    if (chars.length === 0) {
      setActivePreview(true);
      setTimeout(() => {
        router.push("/works");
      }, 1500);
      return;
    }

    gsap.killTweensOf(chars);
    gsap.to(chars, {
      yPercent: -100,
      opacity: 0,
      stagger: 0.02,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: () => {
        setActivePreview(true);
        // Clean route push after cinematic transition
        setTimeout(() => {
          router.push("/works");
        }, 1500);
      },
    });
  };

  const [projects, setProjects] = useState<ProjectItem[]>([]);

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
    if (featured.length === 4) {
      return featured.slice(0, 4);
    }
    const nonFeatured = projects.filter((p) => !p.featured);
    return [...featured, ...nonFeatured].slice(0, 4);
  }, [projects]);

  return (
    <div id="recent-works-section" ref={sectionRef} className="relative h-screen">
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
            <Suspense fallback={null}>
              <CarouselScene
                activePreview={activePreview}
                scrollProgress={scrollProgress}
                projects={carouselProjects}
                titleRef={titleRef}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
