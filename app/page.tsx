"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Preloader from "@/components/custom/preloader";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import RotatingProjects from "@/components/custom/rotating-projects";
import HorizontalScroll from "@/components/sections/Horizontal-Scroll";
import Swiper from "@/components/custom/swiper";
import Footer from "@/components/sections/Footer";
import ScrollCarousel from "@/components/custom/ScrollCarousel";
import CylinderPortfolio from "@/components/custom/CylinderPortfolio";

// Register the hook to prevent tree-shaking issues
gsap.registerPlugin(useGSAP);

export default function Page() {
  const container = useRef<HTMLElement>(null);
  const [masterTl, setMasterTl] = useState<gsap.core.Timeline | null>(null);

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
          <Preloader masterTl={masterTl} />
          <Hero masterTl={masterTl} />
          <About />
          <HorizontalScroll />
          <RotatingProjects />
          {/* <ScrollCarousel/> */}
          {/* <CylinderPortfolio/> */}
          <Swiper/>
          <Footer />
        </>
      )}
    </main>
  );
}
