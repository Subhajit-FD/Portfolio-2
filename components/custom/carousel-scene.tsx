"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Image, Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
          <h1
            ref={titleRef}
            className="text-3xl md:text-5xl text-foreground uppercase font-mono text-nowrap select-none font-bold tracking-tight"
          >
            Recent Works
          </h1>
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
    <Image
      url={url}
      position={position}
      rotation={rotation}
      scale={[width, height]}
      transparent
      side={THREE.DoubleSide}
    />
  );
}