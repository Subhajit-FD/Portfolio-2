"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Image as DreiImage, Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ProjectItem {
  _id: string;
  title: string;
  desktopImage?: string;
  mobileImage?: string;
}

interface CarouselSceneProps {
  activePreview: boolean;
  scrollProgress: React.RefObject<number>;
  projects?: ProjectItem[];
  titleRef?: React.RefObject<HTMLHeadingElement | null>;
}

const fallbackImages = [
  "/images/img1.webp",
  "/images/img2.webp",
  "/images/img3.webp",
  "/images/img4.webp",
];

export default function CarouselScene({ activePreview, scrollProgress, projects = [], titleRef }: CarouselSceneProps) {
  const scrollGroupRef = useRef<THREE.Group>(null);
  const transitionGroupRef = useRef<THREE.Group>(null);

  const radius = 6;
  const [isMobile, setIsMobile] = useState(false);

  // FIX 1: Clean execution of event listener, running only once on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []); // Empty dependency array prevents loops

  const displayImages = useMemo(() => {
    if (projects.length > 0) {
      return projects.map((p) => {
        if (isMobile) {
          return p.mobileImage || p.desktopImage || "/images/img1.webp";
        }
        return p.desktopImage || p.mobileImage || "/images/img1.webp";
      });
    }
    return fallbackImages;
  }, [projects, isMobile]);

  const count = displayImages.length;

  const cardTransforms = useMemo(() => {
    return displayImages.map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        position: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius] as [number, number, number],
        rotation: [0, angle, 0] as [number, number, number],
      };
    });
  }, [count, radius, displayImages]);

  useFrame(() => {
    if (!scrollGroupRef.current) return;
    const offset = scrollProgress.current;
    scrollGroupRef.current.rotation.y = -offset * (Math.PI * 2);

    scrollGroupRef.current.rotation.x = THREE.MathUtils.lerp(0.05, -0.05, offset);
    scrollGroupRef.current.rotation.z = THREE.MathUtils.lerp(0.05, -0.05, offset);
  });

  useGSAP(
    () => {
      if (!transitionGroupRef.current) return;

      if (activePreview) {
        gsap.to(transitionGroupRef.current.position, { z: 25, duration: 2.5, ease: "power4.inOut" });
        gsap.to(transitionGroupRef.current.rotation, {
          x: Math.PI / 2,
          y: -Math.PI * 2,
          z: Math.PI * 1.5,
          duration: 2.5,
          ease: "power4.inOut",
        });
      } else {
        gsap.to(transitionGroupRef.current.position, { z: 0, y: 0, duration: 1.5, ease: "expo.out", delay: 0.5 });
        gsap.to(transitionGroupRef.current.rotation, { x: 0, y: 0, z: 0, duration: 1.5, ease: "expo.out", delay: 0.5 });
      }
    },
    { dependencies: [activePreview] },
  );

  useGSAP(
    () => {
      gsap.fromTo(
        ".title-char",
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.04,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: "#recent-works-section",
            start: "top 30%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    []
  );

  return (
    <group ref={transitionGroupRef}>
      {titleRef && (
        <Html
          position={[0, 0, 0]}
          center
          transform
          distanceFactor={15}
          pointerEvents="none"
          zIndexRange={[0, 5]}
        >
          <h2
            ref={titleRef}
            className="text-fluid-heading max-sm:text-2xl text-foreground uppercase font-heading text-nowrap select-none font-bold tracking-tight overflow-hidden pb-2"
          >
            {"Recent Works".split("").map((char, i) => (
              <span
                key={i}
                className="title-char inline-block transform-gpu"
                style={{ display: "inline-block" }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h2>
        </Html>
      )}
      <group ref={scrollGroupRef}>
        {displayImages.map((src, i) => (
          <CarouselCard
            key={i}
            url={src}
            position={cardTransforms[i].position}
            rotation={cardTransforms[i].rotation}
            isMobile={isMobile}
          />
        ))}
      </group>
    </group>
  );
}

interface CarouselCardProps {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isMobile: boolean;
}

function CarouselCard({ url, position, rotation, isMobile }: CarouselCardProps) {
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setAspect(img.naturalWidth / img.naturalHeight);
    };
  }, [url]);

  const height = isMobile ? 5.0 : 4.2;

  // FIX 2: Ensure responsive width scales layout regardless of aspect state
  const baseWidth = aspect ? height * aspect : 7.46;
  const width = isMobile ? baseWidth : baseWidth;

  return (
    <DreiImage
      url={url}
      position={position}
      rotation={rotation}
      scale={[width, height]}
      transparent
      side={THREE.DoubleSide}
    />
  );
}