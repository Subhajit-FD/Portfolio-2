"use client";

// CylinderPortfolio.tsx — scroll-driven 360° carousel
// CHANGES from original:
//   • Removed: drag/touch spin, velocity, friction, snap, idle speed
//   • Removed: 6 separate scroll sections
//   • Added:   one tall scroll section (sticky canvas) — CONFIG.scrollHeightVh
//   • Added:   GSAP ScrollTrigger scrub drives group.rotation.y 0 → 2π
//   • Added:   GSAP clip-path page transition overlay on card click
//   • Kept:    CardShader, CardMesh, ImageCard, VideoCard, responsive system, hover title — all unchanged

import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  useTexture,
  useVideoTexture,
  Html,
  shaderMaterial,
} from "@react-three/drei";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// ── Types ─────────────────────────────────────────────────
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
  uRadius: number;
  uBend: number;
  uOpacity: number;
  uHover: number;
  uRimStrength: number;
  uAccent: THREE.Color;
};

declare module "@react-three/fiber" {
  interface ThreeElements {
    cardShader: THREE.ShaderMaterial &
      Partial<CardShaderUniforms> & {
        ref?: React.Ref<THREE.ShaderMaterial & CardShaderUniforms>;
        transparent?: boolean;
        side?: THREE.Side;
      };
  }
}

// ─────────────────────────────────────────────────────────
// CONFIG — change everything here, touch nothing else
// ─────────────────────────────────────────────────────────
type ResponsiveValues = {
  cardWidth: number;
  cardHeight: number;
  radiusBase: number;
  radiusPerCard: number;
  cameraFov: number;
  cameraZ: number;
};

const BREAKPOINTS: { query: string; values: ResponsiveValues }[] = [
  {
    query: "(max-width: 639px)",
    values: {
      cardWidth: 1.2,
      cardHeight: 0.65,
      radiusBase: 2.2,
      radiusPerCard: 0.4,
      cameraFov: 40,
      cameraZ: 7,
    },
  },
  {
    query: "(min-width: 640px) and (max-width: 1023px)",
    values: {
      cardWidth: 1.6,
      cardHeight: 0.85,
      radiusBase: 2.8,
      radiusPerCard: 0.5,
      cameraFov: 35,
      cameraZ: 8.5,
    },
  },
  {
    query: "(min-width: 1024px)",
    values: {
      cardWidth: 1.9,
      cardHeight: 1.0,
      radiusBase: 3.5,
      radiusPerCard: 0.58,
      cameraFov: 30,
      cameraZ: 10,
    },
  },
];

const DESKTOP = BREAKPOINTS[2].values;

const CONFIG = {
  // ── How tall the scroll section is (more vh = slower/smoother feel) ──
  scrollHeightVh: 500,

  // ── Scrub lag: higher = more lag behind scroll ───────────────────────
  scrubAmount: 1.6,

  // ── Card opacity by distance from front ──────────────────────────────
  centerOpacity: 1.0,
  adjOpacity:    0.85,
  farOpacity:    0.6,

  // ── Lerp speeds ──────────────────────────────────────────────────────
  opacityLerpSpeed: 0.1,
  hoverLerpSpeed:   0.12,

  // ── Shader: card visuals ─────────────────────────────────────────────
  cornerRadius:    0,
  bendAmount:      0.1,
  hoverRimStrength: 0.5,

  // ── Page-transition overlay ──────────────────────────────────────────
  transitionDuration: 0.7,

  // ── Scene layering ───────────────────────────────────────────────────
  canvasZIndex: 3,
} as const;

// ── Responsive config hook ────────────────────────────────
function useResponsiveConfig(): ResponsiveValues {
  const [values, setValues] = useState<ResponsiveValues>(DESKTOP);

  const update = useCallback(() => {
    for (const bp of BREAKPOINTS) {
      if (window.matchMedia(bp.query).matches) {
        setValues(bp.values);
        return;
      }
    }
    setValues(DESKTOP);
  }, []);

  useEffect(() => {
    update();
    const mediaLists = BREAKPOINTS.map((bp) => window.matchMedia(bp.query));
    const handler = () => update();
    mediaLists.forEach((ml) => ml.addEventListener("change", handler));
    return () => mediaLists.forEach((ml) => ml.removeEventListener("change", handler));
  }, [update]);

  return values;
}

// ── Shader ────────────────────────────────────────────────
const CardShader = shaderMaterial(
  {
    map: null as unknown as THREE.Texture,
    uRadius: CONFIG.cornerRadius,
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
    uniform float uRadius, uOpacity, uHover, uRimStrength;
    uniform vec3 uAccent;
    void main() {
      vec4 tex = texture2D(map, vUv);

      vec2 p    = abs(vUv - 0.5);
      vec2 size = vec2(0.5);
      float r   = clamp(uRadius, 0.0, 0.5);
      vec2 d    = p - (size - r);
      float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      float mask = 1.0 - smoothstep(-0.002, 0.002, dist);

      float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      float rim  = smoothstep(0.04, 0.0, edge) * uHover * uRimStrength;

      tex.rgb = mix(tex.rgb, uAccent, rim);
      gl_FragColor = vec4(tex.rgb, tex.a * uOpacity * mask);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
);
extend({ CardShader });

// ── Card props ────────────────────────────────────────────
type CardProps = {
  project: Project;
  index: number;
  total: number;
  radius: number;
  currentIndex: number;
  /** Called when the front card is clicked — triggers GSAP page transition */
  onCardClick: (href: string, accentColor: string) => void;
  cardWidth: number;
  cardHeight: number;
};

// ── Single card (image) ───────────────────────────────────
function ImageCard(props: CardProps) {
  const tex = useTexture(props.project.mediaUrl);
  return <CardMesh tex={tex} {...props} />;
}

// ── Single card (video) ───────────────────────────────────
function VideoCard(props: CardProps) {
  const tex = useVideoTexture(props.project.mediaUrl, {
    muted: true,
    loop: true,
    crossOrigin: "anonymous",
  });
  return <CardMesh tex={tex as THREE.Texture} {...props} />;
}

// ── Shared card mesh ──────────────────────────────────────
function CardMesh({
  tex,
  project,
  index,
  total,
  radius,
  currentIndex,
  onCardClick,
  cardWidth,
  cardHeight,
}: CardProps & { tex: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat  = useRef<THREE.ShaderMaterial & CardShaderUniforms>(null);
  const [hovered, setHovered] = useState(false);

  const srgbTex = useMemo(() => {
    const t = tex.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [tex]);

  const angle = (index * Math.PI * 2) / total;
  const pos: [number, number, number] = [
    Math.sin(angle) * radius,
    0,
    Math.cos(angle) * radius,
  ];

  const getOp = useCallback((): number => {
    let d = Math.abs(index - currentIndex);
    if (d > total / 2) d = total - d;
    return d === 0
      ? CONFIG.centerOpacity
      : d === 1
        ? CONFIG.adjOpacity
        : CONFIG.farOpacity;
  }, [index, currentIndex, total]);

  useFrame(() => {
    if (mesh.current) mesh.current.lookAt(0, 0, 0);
    if (mat.current) {
      mat.current.uOpacity = THREE.MathUtils.lerp(
        mat.current.uOpacity,
        getOp(),
        CONFIG.opacityLerpSpeed,
      );
      mat.current.uHover = THREE.MathUtils.lerp(
        mat.current.uHover,
        hovered ? 1 : 0,
        CONFIG.hoverLerpSpeed,
      );
    }
  });

  const isFocused = index === currentIndex;

  return (
    <mesh
      ref={mesh}
      position={pos}
      onClick={(e) => {
        if (!isFocused) return;
        e.stopPropagation();
        // ↓ CHANGED: instead of window.open directly, fire the transition
        onCardClick(project.href, project.accentColor ?? "#ffffff");
      }}
      onPointerOver={(e) => {
        if (!isFocused) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <planeGeometry args={[cardWidth, cardHeight, 16, 1]} />
      <cardShader
        ref={mat}
        map={srgbTex}
        uRadius={CONFIG.cornerRadius}
        uBend={CONFIG.bendAmount}
        uRimStrength={CONFIG.hoverRimStrength}
        uAccent={new THREE.Color(project.accentColor ?? "#ffffff")}
        transparent
        side={THREE.DoubleSide}
      />

      {/* drei Html — hover split-text title (unchanged) */}
      {hovered && isFocused && (
        <Html
          center
          position={[0, cardHeight / 20, 0.01]}
          style={{ pointerEvents: "none" }}
        >
          <div className="flex gap-px whitespace-nowrap font-semibold tracking-wider uppercase text-foreground drop-shadow-lg text-lg sm:text-2xl md:text-4xl lg:text-5xl">
            {project.title.split("").map((char, i) => (
              <span
                key={`${project.id}-char-${i}`}
                className="inline-block overflow-hidden"
              >
                <span
                  className="inline-block animate-[splitReveal_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                  style={{
                    animationDelay: `${i * 25}ms`,
                    transform: "translateY(110%)",
                    whiteSpace: char === " " ? "pre" : undefined,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              </span>
            ))}
          </div>
          <style>{`
            @keyframes splitReveal {
              from { transform: translateY(110%); }
              to   { transform: translateY(0); }
            }
          `}</style>
        </Html>
      )}
    </mesh>
  );
}

// ── Carousel props ────────────────────────────────────────
type CarouselProps = {
  projects: Project[];
  /** Shared mutable ref — GSAP writes rotation here, useFrame reads it */
  rotationY: React.MutableRefObject<number>;
  onCardClick: (href: string, accentColor: string) => void;
  responsive: ResponsiveValues;
};

// ── Spinning group ─────────────────────────────────────────
// CHANGED: no drag, no velocity, no snap logic.
// Rotation is ONLY driven by rotationY ref (set by GSAP ScrollTrigger outside canvas).
function Carousel({ projects, rotationY, onCardClick, responsive }: CarouselProps) {
  const group = useRef<THREE.Group>(null);
  const [idx, setIdx] = useState(0);
  const { camera } = useThree();

  // Sync camera FOV/position when breakpoint changes (same as before)
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov      = responsive.cameraFov;
      camera.position.z = responsive.cameraZ;
      camera.updateProjectionMatrix();
    }
  }, [camera, responsive]);

  const radius = Math.max(
    responsive.radiusBase,
    projects.length * responsive.radiusPerCard,
  );

  useFrame(() => {
    if (!group.current) return;

    // Apply the rotation value written by GSAP
    group.current.rotation.y = rotationY.current;

    // Track which card faces front so opacity/hover/click logic works
    const n    = projects.length;
    const step = (Math.PI * 2) / n;
    const a    = ((-rotationY.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const newIdx = Math.round(a / step) % n;
    if (newIdx !== idx) setIdx(newIdx);
  });

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        {projects.map((p, i) => {
          const C = p.mediaType === "video" ? VideoCard : ImageCard;
          return (
            <C
              key={p.id}
              project={p}
              index={i}
              total={projects.length}
              radius={radius}
              currentIndex={idx}
              onCardClick={onCardClick}
              cardWidth={responsive.cardWidth}
              cardHeight={responsive.cardHeight}
            />
          );
        })}
      </Suspense>
    </group>
  );
}

// ── Page-transition overlay ───────────────────────────────
// A full-screen div that plays a clip-path wipe using the card's accent color,
// then navigates after the wipe completes.
type OverlayRef = { trigger: (href: string, accent: string) => void };

const PageTransitionOverlay = forwardRef<OverlayRef>(function PageTransitionOverlay(
  _,
  ref,
) {
  const el = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    trigger(href: string, accent: string) {
      if (!el.current) return;
      const overlay = el.current;

      // Reset state
      gsap.set(overlay, { display: "block", clipPath: "inset(100% 0 0 0)" });
      overlay.style.backgroundColor = accent;

      gsap
        .timeline()
        // Wipe IN from bottom
        .to(overlay, {
          clipPath: "inset(0% 0 0 0)",
          duration: CONFIG.transitionDuration * 0.55,
          ease: "power3.inOut",
        })
        // Short pause at full coverage, then navigate
        .add(() => {
          window.open(href, "_blank", "noopener,noreferrer");
        })
        // Wipe OUT upward
        .to(overlay, {
          clipPath: "inset(0 0 100% 0)",
          duration: CONFIG.transitionDuration * 0.55,
          ease: "power3.inOut",
          delay: 0.08,
        })
        .set(overlay, { display: "none" });
    },
  }));

  return (
    <div
      ref={el}
      className="pointer-events-none fixed inset-0 hidden"
      style={{ zIndex: 9999, willChange: "clip-path" }}
    />
  );
});

// ── Root component ────────────────────────────────────────
export default function CylinderPortfolio({
  projects = SAMPLE_PROJECTS,
}: {
  projects?: Project[];
}) {
  const responsive   = useResponsiveConfig();
  const overlayRef   = useRef<OverlayRef>(null);

  // CHANGED: rotationY is now driven purely by GSAP ScrollTrigger
  const rotationY    = useRef(0);

  // Refs for GSAP targets
  const wrapperRef   = useRef<HTMLDivElement>(null); // tall scroll section
  const stickyRef    = useRef<HTMLDivElement>(null); // sticky viewport

  // ── GSAP ScrollTrigger: maps scroll progress 0→1 to rotation 0→2π ──
  useGSAP(
    () => {
      const proxy = { rotation: 0 };

      const st = gsap.to(proxy, {
        rotation: Math.PI * 2,          // one full revolution
        ease: "none",                    // linear — ScrollTrigger scrub handles easing
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: CONFIG.scrubAmount,     // lag between scroll and rotation
          // Optional: snap each card into place
          snap: {
            snapTo: 1 / (projects.length - 1),
            duration: { min: 0.3, max: 0.6 },
            ease: "power2.inOut",
          },
        },
        onUpdate() {
          rotationY.current = proxy.rotation;
        },
      });

      return () => {
        st.scrollTrigger?.kill();
        st.kill();
      };
    },
    { scope: wrapperRef, dependencies: [projects.length] },
  );

  const handleCardClick = useCallback((href: string, accent: string) => {
    overlayRef.current?.trigger(href, accent);
  }, []);

  return (
    <>
      {/*
        CHANGED: one single tall scroll section.
        Height = CONFIG.scrollHeightVh — this is what gives the scroll "room".
        The sticky child keeps the canvas fixed while the user scrolls through it.
      */}
      <div
        ref={wrapperRef}
        style={{ height: `${CONFIG.scrollHeightVh}vh` }}
        className="relative w-full bg-background"
      >
        {/* Sticky container — stays at top of viewport for the full scroll distance */}
        <div
          ref={stickyRef}
          className="sticky top-0 h-dvh w-full overflow-hidden"
        >
          {/* Canvas — same setup as before, alpha so page bg shows */}
          <Canvas
            camera={{
              fov:      responsive.cameraFov,
              position: [0, 0, responsive.cameraZ] as [number, number, number],
            }}
            gl={{ antialias: true, alpha: true }}
            style={{
              position: "absolute",
              inset:    0,
              zIndex:   CONFIG.canvasZIndex,
            }}
          >
            <Carousel
              projects={projects}
              rotationY={rotationY}
              onCardClick={handleCardClick}
              responsive={responsive}
            />
          </Canvas>

          {/* "Recent Projects" label — same as original, sits behind canvas */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-lg font-bold tracking-widest uppercase sm:text-xl md:text-2xl"
            style={{ zIndex: CONFIG.canvasZIndex - 1 }}
          >
            <h3>Recent Projects</h3>
          </div>

          {/* Scroll hint — fades away once user starts scrolling */}
          <ScrollHint />
        </div>
      </div>

      {/* Page-transition overlay — lives outside scroll section so it covers full viewport */}
      <PageTransitionOverlay ref={overlayRef} />
    </>
  );
}

// ── Scroll hint ───────────────────────────────────────────
function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500"
      style={{ zIndex: CONFIG.canvasZIndex + 1, opacity: visible ? 1 : 0 }}
    >
      <span className="text-xs uppercase tracking-[0.3em] text-foreground/40">
        Scroll to explore
      </span>
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        className="text-foreground/30"
      >
        <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5" />
        <rect
          x="7" y="5" width="2" height="5" rx="1"
          fill="currentColor"
          className="animate-[scrollDot_1.6s_ease-in-out_infinite]"
        />
      </svg>
      <style>{`
        @keyframes scrollDot {
          0%,100% { transform: translateY(0);   opacity: 1; }
          60%      { transform: translateY(8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Sample data (unchanged) ───────────────────────────────
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
    href: "/cases/studiopomelo",
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
    href: "https://www.google.com",
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
    title: "Editorial Design",
    year: "2022",
    tags: ["UI/UX", "Editorial"],
    mediaType: "image",
    mediaUrl:
      "https://framerusercontent.com/images/0KTlYQrYRIYHfp0K6GrYG963Eo.jpg",
    accentColor: "#A8DADC",
    href: "/cases/editorial",
    description: "Modern editorial layout system.",
  },
];
