"use client";

import { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface DbProjectItem {
  _id: string;
  title: string;
  desktopImage?: string;
  mobileImage?: string;
  liveUrl?: string;
  githubUrl?: string;
}

interface ProjectItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured?: boolean;
}

// Static fallback used when no projects exist in the database yet
const fallbackImages: ProjectItem[] = [
  { _id: "1", title: "Kai Vega", description: "", imageUrl: "/images/ochi-design-1.jpg", tags: [] },
  { _id: "2", title: "Riven Juno", description: "", imageUrl: "/images/img2.webp", tags: [] },
  { _id: "3", title: "Lex Orion", description: "", imageUrl: "/images/img3.webp", tags: [] },
  { _id: "4", title: "Ash Kairos", description: "", imageUrl: "/images/img4.webp", tags: [] },
];

interface PreviewGridProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: DbProjectItem[];
}

export default function PreviewGrid({ isOpen, onClose, projects = [] }: PreviewGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const displayProjects: ProjectItem[] = useMemo(() => {
    if (projects.length > 0) {
      return projects.map((p) => ({
        _id: p._id,
        title: p.title,
        description: "",
        imageUrl: p.mobileImage || p.desktopImage || "/images/img1.webp",
        tags: [] as string[],
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
      }));
    }
    return fallbackImages;
  }, [projects]);

  useGSAP(() => {
    const items = itemsRef.current.filter(Boolean) as HTMLElement[];
    if (!containerRef.current || !items.length) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const itemData = items.map((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = centerX - cx;
      const dy = centerY - cy;
      const dist = Math.hypot(dx, dy);

      return {
        el,
        dx,
        dy,
        dist,
        isLeft: cx < centerX,
      };
    });

    const maxDist = Math.max(...itemData.map((d) => d.dist));
    const totalStagger = 0.04 * (itemData.length - 1);

    // MASTER TIMELINE
    const tl = gsap.timeline();

    if (isOpen) {
      tl.set(containerRef.current, {
        autoAlpha: 1,
        pointerEvents: "auto",
      });

      tl.delay(2.5); // sync with 3D

      itemData.forEach(({ el, dx, dy, dist, isLeft }) => {
        const norm = maxDist ? dist / maxDist : 0;

        const delay = Math.pow(1 - norm, 2.5) * totalStagger;
        const rotationY = isLeft ? 90 : -90;

        // Depth
        tl.fromTo(
          el,
          { z: -2500 },
          {
            z: 0,
            duration: 0.5,
            ease: "power4.out",
          },
          delay
        );

        // Main motion
        tl.fromTo(
          el,
          {
            transformOrigin: `50% 50% ${dx * -0.6}px`,
            autoAlpha: 0,
            y: dy * 0.6,
            scale: 0.6,
            rotationY,
          },
          {
            y: 0,
            scale: 1,
            rotationY: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          delay
        );
      });
    } else {
      itemData.forEach(({ el, dy, dist, isLeft }) => {
        const norm = maxDist ? dist / maxDist : 0;
        const delay = Math.pow(norm, 1.8) * totalStagger;
        const rotationY = isLeft ? 90 : -90;

        tl.to(
          el,
          {
            y: dy * 0.4,
            rotationY,
            scale: 0.5,
            autoAlpha: 0,
            duration: 0.5,
            ease: "power3.in",
          },
          delay
        );

        tl.to(
          el,
          {
            z: -2500,
            duration: 0.4,
            ease: "power4.in",
          },
          delay + 0.05
        );
      });

      tl.set(containerRef.current, {
        autoAlpha: 0,
        pointerEvents: "none",
      }, "+=0.6");
    }
  }, [isOpen, displayProjects]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 px-[15vw] pt-20 pb-10 overflow-y-auto bg-background opacity-0 pointer-events-none"
    >
      <header className="flex justify-between mb-8">
        <h2 className="text-2xl text-foreground font-mono uppercase">
          Recent Works
        </h2>

        <button onClick={onClose} className="text-foreground uppercase font-mono cursor-pointer">
          Close ×
        </button>
      </header>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-12 perspective-[900px]">
        {displayProjects.map((item, i) => (
          <figure
            key={item._id}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="transform-3d"
          >
            <a
              href={item.liveUrl || item.githubUrl || "#"}
              target={item.liveUrl || item.githubUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="block"
            >
              <div
                className="aspect-4/5 bg-cover bg-center rounded-sm"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />
            </a>
            <figcaption className="text-foreground font-mono mt-2 uppercase text-sm">
              {item.title}
              {item.tags.length > 0 && (
                <span className="block text-xs text-muted-foreground mt-1 normal-case">
                  {item.tags.join(" · ")}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}