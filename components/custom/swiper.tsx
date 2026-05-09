"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Slide {
  text: string;
  username: string;
  color: string;
}

const slidesData: Slide[] = [
  {
    text: "UI/UX Design: Crafting intuitive and visually stunning interfaces with a focus on user experience and aesthetic excellence.",
    username: "Service 01",
    color: "#FFFF00",
  },
  {
    text: "Frontend Development: Building responsive, high-performance web applications using modern frameworks and pixel-perfect implementation.",
    username: "Service 02",
    color: "#55DB9C",
  },
  {
    text: "Backend Development: Architecting robust, scalable server-side solutions and APIs to power seamless digital experiences.",
    username: "Service 03",
    color: "#E9CCFF",
  },
  {
    text: "Full-Stack Development: Delivering end-to-end solutions by bridging the gap between design, frontend, and backend architecture.",
    username: "Service 04",
    color: "#FB4903",
  },
  {
    text: "Creative Development: Pushing boundaries with immersive animations, 3D experiences, and interactive storytelling.",
    username: "Service 05",
    color: "#4DA2FF",
  },
];

const Swiper = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const wrapper = wrapperRef.current;
    const section = sectionRef.current;
    if (!wrapper || !section) return;

    const slides = Array.from(wrapper.children) as HTMLElement[];
    
    // Calculate scroll parameters
    const totalWidth = wrapper.scrollWidth;
    const isMobile = window.innerWidth < 768;
    const containerWidth = isMobile ? section.offsetWidth : section.offsetWidth / 2;
    const maxScroll = -(totalWidth - containerWidth);

    // Proxy object to maintain the exact same animation logic
    const state = { current: 0 };

    const updateSlides = () => {
      const vwOffset = window.innerWidth * 0.1;

      slides.forEach((slide, i) => {
        const slideWidth = slide.offsetWidth;
        const slideLeft = slide.offsetLeft + state.current;
        const bgColor = slidesData[i]?.color || "#FFF";
        const isLast = i === slidesData.length - 1;

        if (slideLeft < 0 && !isLast) {
          const ratio = Math.min(1, Math.abs(slideLeft) / slideWidth);
          gsap.set(slide, {
            backgroundColor: bgColor,
            borderColor: "rgba(0,0,0,0.6)",
            transformOrigin: "left 80%",
            x: -slide.offsetLeft + ratio * vwOffset,
            rotation: -15 * ratio,
            scale: 1 - ratio * 0.4,
            zIndex: i + 1,
            position: "relative",
          });
        } else {
          gsap.set(slide, {
            backgroundColor: bgColor,
            borderColor: "rgba(0,0,0,0.6)",
            x: state.current,
            rotation: 0,
            scale: 1,
            zIndex: i + 1,
            transformOrigin: "center center",
          });
        }
      });
    };

    // Initialize slides position
    updateSlides();

    // ScrollTrigger to drive the 'state.current' value
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${totalWidth}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Map scroll progress to our maxScroll range
        state.current = self.progress * maxScroll;
        updateSlides();
      },
    });

  }, { scope: sectionRef });

  return (
    <div ref={sectionRef} className="flex flex-col md:flex-row h-dvh w-full items-center gap-[4vw] md:gap-[2vw] overflow-hidden bg-background py-10 md:py-0">
      <div className="flex h-[35vh] md:h-full w-full md:w-1/2 flex-col items-start justify-center px-[8vw] md:px-[4vw] bg-background z-50 relative">
        <h2 className="text-[18vw] md:text-[14vw] leading-[.8] font-bold uppercase text-primary">
          Why <br /> me ?
        </h2>
        <p className="mt-[4vw] md:mt-[2vw] w-full md:w-[80%] font-sans text-[4vw] md:text-[1.5vw] font-medium text-zinc-500">
          I bridge the gap between design and technology, delivering comprehensive solutions across the digital spectrum.
        </p>
      </div>

      <div className="relative h-[65vh] md:h-full w-full md:w-1/2 overflow-visible">
        <div
          ref={wrapperRef}
          className="flex h-full items-center will-change-transform"
        >
          {slidesData.map((slide, index) => (
            <div
              key={index}
              className={`pointer-events-none flex h-[50vh] w-[80vw] md:h-[40vw] md:w-[30vw] shrink-0 flex-col justify-between rounded-[4vw] md:rounded-[2vw] border-2 border-black/60 p-[6vw] md:p-[2vw] ${
                index < slidesData.length - 1 ? "mr-[4vw] md:mr-[2vw]" : ""
              }`}
              style={{ backgroundColor: slide.color }}
            >
              <p className="font-sans text-[6vw] md:text-[2vw] leading-tight font-medium text-black">
                {slide.text}
              </p>
              <p className="font-sans text-[4vw] md:text-[1.5vw] font-medium text-black/60 uppercase">
                {slide.username}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Swiper;


