"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/custom/navbar";
import Footer from "@/components/sections/Footer";
import Image from "next/image";
import { ISettings } from "@/lib/types";
import { ArrowUpRight } from "@phosphor-icons/react";

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
  imageUrl: string;
  liveUrl?: string;
  githubUrl?: string;
}

const fallbackImages: ProjectItem[] = [
  { _id: "1", title: "Kai Vega", imageUrl: "/images/img1.webp" },
  { _id: "2", title: "Riven Juno", imageUrl: "/images/img2.webp" },
  { _id: "3", title: "Lex Orion", imageUrl: "/images/img3.webp" },
  { _id: "4", title: "Ash Kairos", imageUrl: "/images/img4.webp" },
];

export default function WorksPage() {
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [projects, setProjects] = useState<DbProjectItem[]>([]);

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error("Error loading settings:", err));

    // Fetch projects
    fetch("/api/projects", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  const displayProjects: ProjectItem[] = useMemo(() => {
    if (projects.length > 0) {
      return projects.map((p) => ({
        _id: p._id,
        title: p.title,
        imageUrl: p.desktopImage || p.mobileImage || "/images/img1.webp",
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
      }));
    }
    return fallbackImages;
  }, [projects]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <Navbar settings={settings} />

      {/* Header */}
      <header className="max-w-[1400px] w-full mx-auto px-6 pt-24 pb-12 flex flex-col gap-4">
        <h1 className="font-heading text-fluid-heading font-black uppercase text-primary tracking-wider">
          Works
        </h1>
        <p className="font-sans text-fluid-body text-zinc-500 max-w-xl">
          A curated selection of scalable applications, responsive frontend solutions, and creative design work.
        </p>
      </header>

      {/* Grid */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {displayProjects.map((item) => (
            <div
              key={item._id}
              className="flex flex-col rounded-lg border border-border/50 bg-card/25 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-primary/50 group"
            >
              {/* Image Frame */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Card Footer Info */}
              <div className="p-5 flex flex-col gap-4 bg-background/50 backdrop-blur-md border-t border-border/50 flex-grow justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="font-subheading text-fluid-subheading font-medium uppercase text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                </div>

                {/* Project Links */}
                <div className="flex items-center gap-6">
                  {item.liveUrl && (
                    <a
                      href={item.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-subheading text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span>Live Site</span>
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                  {item.githubUrl && (
                    <a
                      href={item.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-subheading text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span>Source Code</span>
                      <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer settings={settings} />
    </div>
  );
}
