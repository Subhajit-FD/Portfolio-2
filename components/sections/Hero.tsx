"use client";

import ProfileCard from "@/components/custom/profile-card";
import Navbar from "@/components/custom/navbar";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { ISettings } from "@/lib/types";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin, ScrollTrigger);

interface HeroProps {
  masterTl: gsap.core.Timeline;
  settings?: ISettings | null;
}

const scrambleChars =
  "▙ ▚ ▞ a k i e d z e k ▝ ▀ ▖ ▜ ▛ ▟ ▙ ▚ ▞ ▝ ▀ ▖ a k i e d z e k";

export default function Hero({ masterTl, settings }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const innerCardRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);

  // individual span refs for scramble targets
  const nameRef = useRef<HTMLSpanElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const roleRef = useRef<HTMLSpanElement>(null);
  const locationRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { duration: 1.2, ease: "power3.inOut" },
      });

      // — slide in navbar
      tl.fromTo(navbarRef.current, { yPercent: -100 }, { yPercent: 0 });

      // — slide in card (animate inner div to prevent pinning conflicts)
      tl.fromTo(
        innerCardRef.current,
        { yPercent: 100 },
        { yPercent: 0 },
        "-=0.8",
      );

      // — scramble all text refs together once card lands
      const scrambleTargets = [
        { ref: nameRef, text: "Subhajit" },
        { ref: handleRef, text: settings?.handle || "@filteredout.dev" },
        { ref: roleRef, text: "Full-stack developer" },
        { ref: locationRef, text: "Based in india" },
        { ref: scrollRef, text: "scroll down" },
      ];

      scrambleTargets.forEach(({ ref, text }) => {
        tl.to(
          ref.current,
          {
            duration: 1,
            ease: "none",
            scrambleText: {
              text,
              chars: scrambleChars,
              revealDelay: 0.1,
              speed: 0.5,
            },
          },
          "-=0.6", // overlap so they all scramble in roughly together
        );
      });

      masterTl.add(tl, ">");

      // — Sticky Navbar logic: hide on scroll down, reveal on scroll up
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          if (self.scroll() === 0) {
            gsap.to(navbarRef.current, { yPercent: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          } else if (self.direction === 1) {
            gsap.to(navbarRef.current, { yPercent: -100, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          } else if (self.direction === -1) {
            gsap.to(navbarRef.current, { yPercent: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          }
        }
      });

      // — Scroll-driven: Pin ProfileCard until About section catches up
      // We calculate the card's original visual center to dock exactly flush
      const getCardCenterNode = () => {
        const rect = profileCardRef.current!.getBoundingClientRect();
        return rect.top + rect.height / 2;
      };

      // TWEAK THIS: Change '60' to adjust docking height (positive = stops lower, negative = stops higher)
      const getDockingTarget = () => `center ${getCardCenterNode() - 180}px`;

      // 1. Pin it so it doesn't leave the screen (perfectly smooth, no layout stretching = no double scrollbar)
      ScrollTrigger.create({
        trigger: container.current,
        start: "top top",
        endTrigger: "#card-landing",
        end: getDockingTarget, // uses shared offset
        pin: profileCardRef.current,
        pinSpacing: false, // ensures Hero layout size does not get messed up
        invalidateOnRefresh: true,
      });

      // 2. Animate its scale and rotation while it is pinned (animate inner element!)
      gsap.to(innerCardRef.current, {
        scale: 0.85,
        rotation: -10,
        ease: "none", // IMPORTANT: "none" ensures perfectly smooth, linear 1:1 scrub progression
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          endTrigger: "#card-landing",
          end: getDockingTarget, // uses shared offset so scaling matches pinning
          scrub: 1, // matches lenis smooth scrolling
          invalidateOnRefresh: true,
        },
      });

      // — Fade out side text and scroll hint during scroll
      gsap.to(".hero-side-text", {
        opacity: 0,
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "30% top",
          scrub: 1,
        },
      });
    },
    { dependencies: [masterTl] }, // Removed scope: container so #card-landing can be found globally
  );

  // Dynamic scramble update for the handle when settings load
  useGSAP(
    () => {
      if (settings?.handle && handleRef.current) {
        if (handleRef.current.innerText !== settings.handle) {
          gsap.to(handleRef.current, {
            duration: 1,
            ease: "none",
            scrambleText: {
              text: settings.handle,
              chars: scrambleChars,
              revealDelay: 0.1,
              speed: 0.5,
            },
          });
        }
      }
    },
    { dependencies: [settings] }
  );

  return (
    <div
      ref={container}
      className="relative flex h-dvh w-full flex-col overflow-visible"
    >
      <div ref={navbarRef} className="fixed top-0 left-0 w-full z-50">
        <Navbar settings={settings} />
      </div>

      <div ref={profileCardRef} className="relative z-30 h-full w-full flex-1">
        <div ref={innerCardRef} className="h-full w-full">
          <ProfileCard />
        </div>
      </div>

      {/* Left text */}
      <div className="hero-side-text absolute top-1/2 left-20 hidden -translate-y-1/2 transform md:block">
        <h2 className="font-heading text-5xl font-extrabold tracking-wider uppercase">
          <span ref={nameRef} />
        </h2>
        <p className="text-sm text-zinc-400">
          <span ref={handleRef} />
        </p>
      </div>

      {/* Right text */}
      <div className="hero-side-text absolute top-1/2 right-10 hidden transform md:top-1/2 md:right-20 md:block md:-translate-y-1/2">
        <h2 className="font-heading max-w-90 text-5xl font-extrabold tracking-wider uppercase">
          <span ref={roleRef} />
        </h2>
        <p className="text-sm tracking-widest text-zinc-400 uppercase">
          <span ref={locationRef} />
        </p>
      </div>

      {/* Scroll hint */}
      <div className="hero-side-text absolute bottom-10 left-1/2 -translate-x-1/2 transform">
        <p className="text-center text-xs tracking-widest text-zinc-400 uppercase pl-[0.1em]">
          <span ref={scrollRef} />
        </p>
      </div>
    </div>
  );
}
