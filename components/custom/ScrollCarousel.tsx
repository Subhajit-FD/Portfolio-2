"use client";

// ScrollCarousel.tsx
// A single scroll section that rotates an R3F cylinder carousel through 360°.
// Each card = one project. Click the front card → GSAP page-transition → new route.
//
// Dependencies used (all already in package.json):
//   @react-three/fiber, @react-three/drei, three, gsap, @gsap/react, tailwindcss

import {
  Canvas,
  useFrame,
  useThree,
  extend,
  type ThreeElements,
} from "@react-three/fiber";
import { useTexture, Html, shaderMaterial } from "@react-three/drei";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  forwardRef,
} from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  title: string;
  year: string;
  tags: string[];
  mediaType: "image" | "video";
  mediaUrl: string;
  accentColor?: string;
  href: string;
  description?: string;
};

type CardShaderUniforms = {
  map: THREE.Texture | null;
  uBend: number;
  uOpacity: number;
  uHover: number;
  uRimStrength: number;
  uAccent: THREE.Color;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Card dimensions (world units)
  cardWidth: 1.9,
  cardHeight: 1.06,
  // Radius base + per-card scaling
  radiusBase: 3.6,
  radiusPerCard: 0.55,
  // Camera
  cameraFov: 28,
  cameraZ: 10,
  // Scroll section height (in vh units) — more = slower rotation feel
  scrollHeightVh: 500,
  // Opacity by distance from front card
  centerOpacity: 1.0,
  adjOpacity: 0.72,
  farOpacity: 0.38,
  opacityLerpSpeed: 0.08,
  // Shader
  bendAmount: 0.08,
  hoverRimStrength: 0.55,
  // Transition overlay duration
  transitionDuration: 0.75,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SHADER MATERIAL
// ─────────────────────────────────────────────────────────────────────────────

const CardShader = shaderMaterial(
  {
    map: null as unknown as THREE.Texture,
    uBend: CONFIG.bendAmount,
    uOpacity: 1,
    uHover: 0,
    uRimStrength: CONFIG.hoverRimStrength,
    uAccent: new THREE.Color("#ffffff"),
  } satisfies CardShaderUniforms,
  /* glsl */ `
    varying vec2 vUv;
    uniform float uBend;
    void main() {
      vUv = uv;
      vec3 p = position;
      float nx = (vUv.x - 0.5) * 2.0;
      p.z += nx * nx * uBend;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D map;
    uniform float uOpacity, uHover, uRimStrength;
    uniform vec3 uAccent;
    void main() {
      vec4 tex = texture2D(map, vUv);
      float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      float rim  = smoothstep(0.05, 0.0, edge) * uHover * uRimStrength;
      tex.rgb    = mix(tex.rgb, uAccent, rim);
      gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
);
extend({ CardShader });

// Augment R3F's ThreeElements so JSX <cardShader> typechecks
declare module "@react-three/fiber" {
  interface ThreeElements {
    cardShader: Partial<CardShaderUniforms> & {
      transparent?: boolean;
      side?: THREE.Side;
      ref?: React.Ref<THREE.ShaderMaterial & CardShaderUniforms>;
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD MESH
// ─────────────────────────────────────────────────────────────────────────────

type CardProps = {
  project: Project;
  index: number;
  total: number;
  radius: number;
  currentIndex: number;
  onTransition: (href: string, accent: string) => void;
};

function ImageCard(props: CardProps) {
  const tex = useTexture(props.project.mediaUrl);
  return <CardMesh tex={tex} {...props} />;
}

function CardMesh({
  tex,
  project,
  index,
  total,
  radius,
  currentIndex,
  onTransition,
}: CardProps & { tex: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial & CardShaderUniforms>(null);
  const [hovered, setHovered] = useState(false);

  const srgbTex = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [tex]);

  // Evenly distribute cards around the circle
  const angle = (index * Math.PI * 2) / total;
  const pos: [number, number, number] = [
    Math.sin(angle) * radius,
    0,
    Math.cos(angle) * radius,
  ];

  const targetOpacity = useCallback((): number => {
    let d = Math.abs(index - currentIndex);
    if (d > total / 2) d = total - d;
    if (d === 0) return CONFIG.centerOpacity;
    if (d === 1) return CONFIG.adjOpacity;
    return CONFIG.farOpacity;
  }, [index, currentIndex, total]);

  useFrame(() => {
    if (mesh.current) mesh.current.lookAt(0, 0, 0);
    if (mat.current) {
      mat.current.uOpacity = THREE.MathUtils.lerp(
        mat.current.uOpacity,
        targetOpacity(),
        CONFIG.opacityLerpSpeed,
      );
      mat.current.uHover = THREE.MathUtils.lerp(
        mat.current.uHover,
        hovered ? 1 : 0,
        0.12,
      );
    }
  });

  const isFront = index === currentIndex;

  return (
    <mesh
      ref={mesh}
      position={pos}
      onClick={(e) => {
        if (!isFront) return;
        e.stopPropagation();
        onTransition(project.href, project.accentColor ?? "#ffffff");
      }}
      onPointerOver={(e) => {
        if (!isFront) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <planeGeometry args={[CONFIG.cardWidth, CONFIG.cardHeight, 16, 1]} />
      <cardShader
        ref={mat}
        map={srgbTex}
        uBend={CONFIG.bendAmount}
        uRimStrength={CONFIG.hoverRimStrength}
        uAccent={new THREE.Color(project.accentColor ?? "#ffffff")}
        transparent
        side={THREE.DoubleSide}
      />

      {/* Hover title reveal — only on front card */}
      {hovered && isFront && (
        <Html
          center
          position={[0, -(CONFIG.cardHeight / 2) - 0.18, 0.01]}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-[1px] overflow-hidden">
              {project.title.split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block text-white font-bold uppercase tracking-[0.15em] text-xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                  style={{
                    animation: `slideUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 22}ms both`,
                    fontFamily: "'DM Serif Display', Georgia, serif",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-widest text-white/70 font-medium"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>
        </Html>
      )}
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAROUSEL GROUP (receives rotation from GSAP via ref)
// ─────────────────────────────────────────────────────────────────────────────

type CarouselGroupProps = {
  projects: Project[];
  rotationRef: React.MutableRefObject<number>;
  onTransition: (href: string, accent: string) => void;
};

function CarouselGroup({ projects, rotationRef, onTransition }: CarouselGroupProps) {
  const group = useRef<THREE.Group>(null);
  const [idx, setIdx] = useState(0);
  const prevRot = useRef(0);

  const radius = Math.max(
    CONFIG.radiusBase,
    projects.length * CONFIG.radiusPerCard,
  );

  const { camera } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = CONFIG.cameraFov;
      camera.position.z = CONFIG.cameraZ;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame(() => {
    if (!group.current) return;

    // Apply rotation driven by GSAP ScrollTrigger
    group.current.rotation.y = rotationRef.current;

    // Track which card is at the front
    const n = projects.length;
    const step = (Math.PI * 2) / n;
    const r = rotationRef.current;
    if (r !== prevRot.current) {
      prevRot.current = r;
      const norm = ((-r % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const nearest = Math.round(norm / step) % n;
      if (nearest !== idx) setIdx(nearest);
    }
  });

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        {projects.map((p, i) => (
          <ImageCard
            key={p.id}
            project={p}
            index={i}
            total={projects.length}
            radius={radius}
            currentIndex={idx}
            onTransition={onTransition}
          />
        ))}
      </Suspense>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

type OverlayHandle = { play: (href: string, accent: string) => void };

const TransitionOverlay = forwardRef<OverlayHandle>((_, ref) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof ref === "function") return;
    if (!ref) return;
    ref.current = {
      play(href: string, accent: string) {
        if (!overlayRef.current) return;
        const el = overlayRef.current;
        el.style.backgroundColor = accent;
        const tl = gsap.timeline();
        tl.set(el, { display: "block", clipPath: "inset(100% 0 0 0)" })
          .to(el, {
            clipPath: "inset(0% 0 0 0)",
            duration: CONFIG.transitionDuration * 0.55,
            ease: "power3.inOut",
          })
          .to(
            el,
            {
              clipPath: "inset(0 0 100% 0)",
              duration: CONFIG.transitionDuration * 0.55,
              ease: "power3.inOut",
              onComplete: () => {
                window.open(href, "_blank", "noopener,noreferrer");
                gsap.set(el, { display: "none" });
              },
            },
            `+=${CONFIG.transitionDuration * 0.1}`,
          );
      },
    };
  }, [ref]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[100] hidden"
      style={{ willChange: "clip-path" }}
    />
  );
});
TransitionOverlay.displayName = "TransitionOverlay";

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL PROGRESS INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function ScrollIndicator({
  progress,
  total,
  current,
}: {
  progress: number;
  total: number;
  current: number;
}) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none">
      {/* Dots */}
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "6px",
              height: "6px",
              background:
                i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
      {/* Scroll cue — fades after 20% scroll */}
      <div
        className="flex flex-col items-center gap-1 transition-opacity duration-500"
        style={{ opacity: progress < 0.05 ? 1 : 0 }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.3em] text-white/50"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Scroll
        </span>
        <div className="w-[1px] h-6 bg-white/30 animate-pulse" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScrollCarousel({
  projects = SAMPLE_PROJECTS,
}: {
  projects?: Project[];
}) {
  // Mutable ref that GSAP writes to, useFrame reads from (avoids React re-renders)
  const rotationRef = useRef(0);
  const overlayRef = useRef<OverlayHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);

  // ── GSAP ScrollTrigger ──────────────────────────────────────────────────
  useGSAP(() => {
    const n = projects.length;
    const totalRotation = Math.PI * 2; // one full revolution

    const trigger = ScrollTrigger.create({
      trigger: scrollContainerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.4, // smooth lag
      onUpdate: (self) => {
        // Map scroll 0→1 to full rotation
        rotationRef.current = self.progress * totalRotation;

        // Update active card index for dots/HUD
        const step = totalRotation / n;
        const norm =
          ((-rotationRef.current % totalRotation) + totalRotation) % totalRotation;
        const nearest = Math.round(norm / step) % n;
        setCurrentIdx(nearest);
        setScrollProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, [projects.length]);

  const handleTransition = useCallback((href: string, accent: string) => {
    overlayRef.current?.play(href, accent);
  }, []);

  return (
    <>
      {/* ── Scroll section (tall, drives ScrollTrigger) ─────────────────── */}
      <div
        ref={scrollContainerRef}
        style={{ height: `${CONFIG.scrollHeightVh}vh` }}
        className="relative w-full"
      >
        {/* Sticky canvas container — stays in view during entire scroll */}
        <div
          ref={stickyRef}
          className="sticky top-0 h-dvh w-full overflow-hidden bg-black"
        >
          {/* Ambient background gradient that shifts with scroll */}
          <div
            className="absolute inset-0 transition-colors duration-700"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${
                projects[currentIdx]?.accentColor ?? "#1a1a2e"
              }22 0%, #000 70%)`,
            }}
          />

          {/* Fine grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
              backgroundSize: "256px 256px",
            }}
          />

          {/* Header */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
            <p
              className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Selected Work
            </p>
            <h2
              className="text-2xl text-white/80 font-light"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {projects[currentIdx]?.title ?? ""}
            </h2>
          </div>

          {/* Year + tags HUD — bottom-right */}
          <div className="absolute bottom-8 right-8 z-10 text-right pointer-events-none">
            <p
              className="text-[11px] text-white/30 tracking-widest uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {projects[currentIdx]?.year}
            </p>
            <div className="flex flex-col items-end gap-0.5 mt-1">
              {projects[currentIdx]?.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] text-white/20 uppercase tracking-[0.2em]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* R3F Canvas */}
          <Canvas
            camera={{
              fov: CONFIG.cameraFov,
              position: [0, 0, CONFIG.cameraZ],
              near: 0.1,
              far: 100,
            }}
            gl={{ antialias: true, alpha: true }}
            className="absolute inset-0"
          >
            <CarouselGroup
              projects={projects}
              rotationRef={rotationRef}
              onTransition={handleTransition}
            />
          </Canvas>

          {/* Scroll progress + dots */}
          <ScrollIndicator
            progress={scrollProgress}
            total={projects.length}
            current={currentIdx}
          />
        </div>
      </div>

      {/* Page-transition overlay */}
      <TransitionOverlay ref={overlayRef} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_PROJECTS: Project[] = [
  {
    id: "studio-pomelo",
    title: "Studio Pomelo",
    year: "2024",
    tags: ["Branding", "Digital", "Motion"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/0KTlYQrYRIYHfp0K6GrYG963Eo.jpg",
    accentColor: "#F4A261",
    href: "/cases/studio-pomelo",
    description: "A vibrant brand identity for a creative studio.",
  },
  {
    id: "seepje",
    title: "Seepje",
    year: "2023",
    tags: ["Branding", "Digital"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/f9aN3gnoZOyegMW0taPko21gf6c.jpg",
    accentColor: "#2A9D8F",
    href: "/cases/seepje",
    description: "Sustainable soap brand visual refresh.",
  },
  {
    id: "bret",
    title: "BRET Concept",
    year: "2024",
    tags: ["Branding", "Motion"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/pdK0vLZUZuLCF4ZiDkVRgOeeeI8.jpg",
    accentColor: "#E63946",
    href: "/cases/bret",
    description: "Bold conceptual branding exploration.",
  },
  {
    id: "editorial",
    title: "Editorial System",
    year: "2022",
    tags: ["UI/UX", "Editorial"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/0KTlYQrYRIYHfp0K6GrYG963Eo.jpg",
    accentColor: "#A8DADC",
    href: "/cases/editorial",
    description: "Modern editorial layout system.",
  },
  {
    id: "forma",
    title: "Forma Studio",
    year: "2023",
    tags: ["3D", "Art Direction"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/f9aN3gnoZOyegMW0taPko21gf6c.jpg",
    accentColor: "#6A0572",
    href: "/cases/forma",
    description: "Abstract 3D art direction for a design studio.",
  },
  {
    id: "kinetic",
    title: "Kinetic Type",
    year: "2024",
    tags: ["Motion", "Typography"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/pdK0vLZUZuLCF4ZiDkVRgOeeeI8.jpg",
    accentColor: "#F7C59F",
    href: "/cases/kinetic",
    description: "Kinetic typography exploration.",
  },
];
