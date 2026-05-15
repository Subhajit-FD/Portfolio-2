"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Image } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const images = [
  "/images/img1.webp",
  "/images/img2.webp",
  "/images/img3.webp",
  "/images/img4.webp",
];

interface CarouselSceneProps {
  activePreview: boolean;
  /** A ref whose `.current` holds 0→1 scroll progress from the parent section */
  scrollProgress: React.RefObject<number>;
}

export default function CarouselScene({ activePreview, scrollProgress }: CarouselSceneProps) {
  const scrollGroupRef = useRef<THREE.Group>(null);
  const transitionGroupRef = useRef<THREE.Group>(null);

  const radius = 6;
  const count = images.length;

  // Calculate static positions for the cards in a circle
  const cardTransforms = useMemo(() => {
    return images.map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        position: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius] as [number, number, number],
        rotation: [0, angle, 0] as [number, number, number],
      };
    });
  }, [count, radius]);

  useFrame(() => {
    if (!scrollGroupRef.current) return;

    // Use the parent-provided scroll progress for a full 360° rotation
    const offset = scrollProgress.current;

    scrollGroupRef.current.rotation.y = -offset * (Math.PI * 2);

    // Subtle tilt effect
    scrollGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      0.05,
      -0.05,
      offset,
    );
    scrollGroupRef.current.rotation.z = THREE.MathUtils.lerp(
      0.05,
      -0.05,
      offset,
    );
  });

  // Click-based transition animation (Outer Group)
  useGSAP(
    () => {
      if (!transitionGroupRef.current) return;

      if (activePreview) {
        gsap.to(transitionGroupRef.current.position, {
          z: 25,
          duration: 2.5,
          ease: "power4.inOut",
        });
        gsap.to(transitionGroupRef.current.rotation, {
          x: Math.PI / 2,
          y: -Math.PI * 2,
          z: Math.PI * 1.5,
          duration: 2.5,
          ease: "power4.inOut",
        });
      } else {
        gsap.to(transitionGroupRef.current.position, {
          z: 0,
          y: 0,
          duration: 1.5,
          ease: "expo.out",
          delay: 0.5,
        });
        gsap.to(transitionGroupRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "expo.out",
          delay: 0.5,
        });
      }
    },
    { dependencies: [activePreview] },
  );

  return (
    <group ref={transitionGroupRef}>
      <group ref={scrollGroupRef}>
        {images.map((src, i) => (
          <Image
            key={i}
            url={src}
            position={cardTransforms[i].position}
            rotation={cardTransforms[i].rotation}
            scale={[3.5, 4.2]}
            transparent
            side={THREE.DoubleSide}
          />
        ))}
      </group>
    </group>
  );
}
