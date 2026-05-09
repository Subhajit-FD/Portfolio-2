"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { DoubleSide, Group, Mesh, MathUtils } from "three";
import { useTheme } from "next-themes";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface PreloaderProps {
  masterTl: gsap.core.Timeline;
}

interface CounterProps {
  masterTl: gsap.core.Timeline;
}

interface SceneProps {
  masterTl: gsap.core.Timeline;
}

const InvertShaderMaterial = shaderMaterial(
  { uTexture: null, uInvert: false },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform bool uInvert;
    void main() {
      vec4 color = texture2D(uTexture, vUv);
      if (color.a < 0.1) discard;
      if (uInvert) {
        color.rgb = 1.0 - color.rgb;
      }
      gl_FragColor = color;
    }
  `,
);

const Scene = ({ masterTl }: SceneProps) => {
  const shapeRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const { resolvedTheme } = useTheme();
  const isInverted = resolvedTheme === "dark";
  const texture = useTexture("/texture.png");
  const material = useMemo(() => new InvertShaderMaterial(), []);
  const { size, camera } = useThree();

  const responsiveSize = useMemo(() => {
    if (window.innerWidth <= 764) return size.width / window.innerHeight;
    return 1;
  }, [size.width]);

  useGSAP(
    () => {
      // Enter: camera zooms in
      masterTl.from(camera.position, {
        z: -5,
        duration: 1.5,
        ease: "power2.inOut",
      }, 0);

      // Exit: camera zooms back out (starts when counter finishes at ~3.5s)
      masterTl.to(camera.position, {
        z: -5,
        duration: 1.5,
        ease: "power2.inOut",
      }, 3.5);
    },
    { dependencies: [masterTl] },
  );

  useFrame((state, delta) => {
    if (shapeRef.current) shapeRef.current.rotation.y -= delta * 1;
    if (groupRef.current) {
      groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, state.pointer.y * 0.4, 0.1);
      groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.4, 0.1);
    }
  });

  return (
    <mesh>
      <group ref={groupRef} rotation={[0, 0.5, 0.2]} scale={responsiveSize}>
        <mesh ref={shapeRef}>
          <cylinderGeometry args={[2, 2, 1, 30, 1, true]} />
          <primitive
            object={material}
            uTexture={texture}
            uInvert={isInverted}
            transparent
            side={DoubleSide}
          />
        </mesh>
      </group>
    </mesh>
  );
};

const Counter = ({ masterTl }: CounterProps) => {
  const [counter, setCounter] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const obj = { value: 0 };
      const tl = gsap.timeline();

      // Enter: slide up
      if (countRef.current) {
        tl.fromTo(
          countRef.current,
          { y: 100 },
          { y: 0, duration: 0.5, ease: "power2.out" },
        );
      }

      // Count to 100
      tl.to(obj, {
        value: 100,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => setCounter(Math.round(obj.value)),
      });

      // Exit: slide down
      if (countRef.current) {
        tl.to(countRef.current, {
          y: 100,
          duration: 0.5,
          ease: "power2.in",
        });
      }

      masterTl.add(tl, 1);
    },
    { dependencies: [masterTl] },
  );

  return (
    <div
      ref={countRef}
      className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2"
    >
      <span>{counter}</span>
      <span>%</span>
    </div>
  );
};

export default function PreLoader({ masterTl }: PreloaderProps) {
  const container = useRef<HTMLDivElement>(null);

  // Container fade-out: added to masterTl so Hero can use ">"
  useGSAP(
    () => {
      if (!container.current) return;
      masterTl.to(container.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => {
          if (container.current) container.current.style.display = "none";
        },
      }, 5.0);
    },
    { scope: container, dependencies: [masterTl] },
  );

  return (
    <div
      ref={container}
      className="w-full h-dvh absolute top-0 left-0 bg-background z-50"
    >
      <Canvas>
        <Scene masterTl={masterTl} />
      </Canvas>
      <Counter masterTl={masterTl} />
    </div>
  );
}