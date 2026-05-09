// CylinderPortfolio.tsx — minimal + fully typed
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  useTexture,
  useVideoTexture,
  Html,
  shaderMaterial,
} from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import * as THREE from "three";

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

// ── Shader material type augmentation ────────────────────
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
  dragSensitivity: number;
};

const BREAKPOINTS: { query: string; values: ResponsiveValues }[] = [
  {
    query: "(max-width: 639px)",   // mobile
    values: {
      cardWidth: 1.2,
      cardHeight: 0.65,
      radiusBase: 2.2,
      radiusPerCard: 0.4,
      cameraFov: 40,
      cameraZ: 7,
      dragSensitivity: 0.0015,
    },
  },
  {
    query: "(min-width: 640px) and (max-width: 1023px)", // tablet
    values: {
      cardWidth: 1.6,
      cardHeight: 0.85,
      radiusBase: 2.8,
      radiusPerCard: 0.5,
      cameraFov: 35,
      cameraZ: 8.5,
      dragSensitivity: 0.001,
    },
  },
  {
    query: "(min-width: 1024px)",  // desktop
    values: {
      cardWidth: 1.9,
      cardHeight: 1.0,
      radiusBase: 3.5,
      radiusPerCard: 0.58,
      cameraFov: 30,
      cameraZ: 10,
      dragSensitivity: 0.0008,
    },
  },
];

// Desktop defaults (used as the fallback)
const DESKTOP = BREAKPOINTS[2].values;

const CONFIG = {
  // ── Carousel / spin ──────────────────────────────────
  idleSpeed: 0.003,
  friction: 0.9,
  snapEnabled: true,

  // ── Card opacity by distance from front ──────────────
  centerOpacity: 1.0,
  adjOpacity: 0.85,
  farOpacity: 0.6,

  // ── Opacity + hover lerp speeds ──────────────────────
  opacityLerpSpeed: 0.1,
  hoverLerpSpeed: 0.0,

  // ── Shader: card visuals ─────────────────────────────
  cornerRadius: 0,
  bendAmount: 0.1,
  hoverRimStrength: 0.5,

  // ── Scene layering ───────────────────────────────────
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
      
      // Correct Box SDF (p is centered at 0.5, range 0 to 0.5)
      vec2 p = abs(vUv - 0.5);
      vec2 size = vec2(0.5);
      float r = clamp(uRadius, 0.0, 0.5);
      
      vec2 d = p - (size - r);
      float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      
      // Sharp mask with tiny AA range
      float mask = 1.0 - smoothstep(-0.002, 0.002, dist);
      
      float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      float rim = smoothstep(0.04, 0.0, edge) * uHover * uRimStrength;
      
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
  onSelect: (p: Project) => void;
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
  onSelect,
  cardWidth,
  cardHeight,
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

  const angle = (index * Math.PI * 2) / total;
  const pos: [number, number, number] = [
    Math.sin(angle) * radius,
    0,
    Math.cos(angle) * radius,
  ];

  const getOp = (): number => {
    let d = Math.abs(index - currentIndex);
    if (d > total / 2) d = total - d;
    return d === 0
      ? CONFIG.centerOpacity
      : d === 1
        ? CONFIG.adjOpacity
        : CONFIG.farOpacity;
  };

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
        window.open(project.href, "_blank", "noopener,noreferrer");
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
      {/* drei Html — hover split-text title */}
      {hovered && (
        <Html
          center
          position={[0, (cardHeight / 20 ), 0.01]}
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
  onSelect: (p: Project) => void;
  responsive: ResponsiveValues;
};

// ── Spinning group ────────────────────────────────────────
function Carousel({ projects, onSelect, responsive }: CarouselProps) {
  const group = useRef<THREE.Group>(null);
  const vel = useRef(0);
  const rot = useRef(0);
  const snapTo = useRef(0);
  const snapping = useRef(false);
  const dragging = useRef(false);
  const [idx, setIdx] = useState(0);
  const { gl, camera } = useThree();

  // Sync camera when responsive breakpoint changes
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = responsive.cameraFov;
      camera.position.z = responsive.cameraZ;
      camera.updateProjectionMatrix();
    }
  }, [camera, responsive]);

  const radius = Math.max(
    responsive.radiusBase,
    projects.length * responsive.radiusPerCard,
  );

  // Drag + touch events
  useEffect(() => {
    let lastX = 0;
    const el = gl.domElement;

    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      lastX = e.clientX;
      snapping.current = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      vel.current += (e.clientX - lastX) * responsive.dragSensitivity;
      lastX = e.clientX;
      snapping.current = false;
    };
    const onUp = () => {
      dragging.current = false;
    };

    // Touch
    const onTouchDown = (e: TouchEvent) => {
      dragging.current = true;
      lastX = e.touches[0].clientX;
      snapping.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      vel.current += (e.touches[0].clientX - lastX) * responsive.dragSensitivity;
      lastX = e.touches[0].clientX;
    };
    const onTouchUp = () => {
      dragging.current = false;
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onTouchDown, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchUp);

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onTouchDown);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchUp);
    };
  }, [gl, responsive]);

  // Physics + snap
  useFrame((_, dt) => {
    if (!group.current) return;
    const n = projects.length;
    const step = (Math.PI * 2) / n;

    // Friction
    vel.current *= Math.pow(CONFIG.friction, dt * 60);

    // Snap to nearest card
    if (
      CONFIG.snapEnabled &&
      !dragging.current &&
      !snapping.current &&
      Math.abs(vel.current) < 0.002
    ) {
      const a = ((-rot.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const near = Math.round(a / step) % n;
      let target = -(near * step);
      while (target - rot.current > Math.PI) target -= Math.PI * 2;
      while (target - rot.current < -Math.PI) target += Math.PI * 2;
      snapTo.current = target;
      snapping.current = true;
      vel.current = 0;
    }

    if (snapping.current) {
      const d = snapTo.current - rot.current;
      if (Math.abs(d) < 0.004) {
        rot.current = snapTo.current;
        snapping.current = false;
      } else {
        rot.current += d * 0.15;
      }
    } else {
      // Idle speed + drag velocity
      rot.current += (CONFIG.idleSpeed + vel.current) * dt * 60;
    }

    group.current.rotation.y = rot.current;


    // Track active index
    const a = ((-rot.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
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
              onSelect={onSelect}
              cardWidth={responsive.cardWidth}
              cardHeight={responsive.cardHeight}
            />
          );
        })}
      </Suspense>
    </group>
  );
}



// ── Root ──────────────────────────────────────────────────
export default function CylinderPortfolio({
  projects = SAMPLE_PROJECTS,
}: {
  projects?: Project[];
}) {
  const responsive = useResponsiveConfig();
  const handleSelect = (p: Project) => window.open(p.href, "_blank", "noopener,noreferrer");

  return (
    <div className="bg-background text-foreground relative h-dvh w-full overflow-hidden">
      {/* Canvas sits above the text layer thanks to canvasZIndex */}
      <Canvas
        camera={{ fov: responsive.cameraFov, position: [0, 0, responsive.cameraZ] }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0, zIndex: CONFIG.canvasZIndex }}
      >
        {/* No <color> background — canvas is transparent so text behind shows through */}
        <Carousel projects={projects} onSelect={handleSelect} responsive={responsive} />
      </Canvas>

      {/* Text behind cards — give this a z-index LOWER than canvasZIndex */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-lg font-bold tracking-widest uppercase sm:text-xl md:text-2xl"
        style={{ zIndex: CONFIG.canvasZIndex - 1 }}
      >
        <h3>Recent Projects</h3>
      </div>
    </div>
  );
}

// ── Sample data ───────────────────────────────────────────
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
