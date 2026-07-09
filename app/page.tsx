"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Preloader from "@/components/custom/preloader";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import HorizontalScroll from "@/components/sections/Horizontal-Scroll";
import Swiper from "@/components/custom/swiper";
import Footer from "@/components/sections/Footer";
import Project from "@/components/sections/Project";
import { ISettings } from "@/lib/types";


// Register the hook to prevent tree-shaking issues
gsap.registerPlugin(useGSAP);

let preloaderHasRun = false;

export default function Page() {
  const container = useRef<HTMLElement>(null);
  const [masterTl, setMasterTl] = useState<gsap.core.Timeline | null>(null);
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [showPreloader, setShowPreloader] = useState(!preloaderHasRun);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error("Error loading settings:", err));
    
    // Once mounted, mark preloader as having run for this session
    preloaderHasRun = true;
  }, []);

  useGSAP(
    () => {
      // Create a paused master timeline
      const tl = gsap.timeline({ paused: true });
      setMasterTl(tl);

      // Wait a brief tick to allow children to mount and nest their timelines
      const timer = setTimeout(() => {
        tl.play();
      }, 50);

      return () => clearTimeout(timer);
    },
    { scope: container },
  );

  return (
    <main
      ref={container}
      className="relative min-h-dvh w-full overflow-x-hidden"
    >
      {masterTl && (
        <>
          {showPreloader && <Preloader masterTl={masterTl} />}
          <Hero masterTl={masterTl} settings={settings} />
          <About />
          <HorizontalScroll />
          {/* <RotatingProjects /> */}
           <Project/>
          <Swiper/>
          <Footer settings={settings} />
        </>
      )}
    </main>
  );
}
