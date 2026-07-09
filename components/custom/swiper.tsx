"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

interface Slide {
  text: string;
  username: string;
  image: string;
}

const slidesData: Slide[] = [
  {
    text: "UI/UX Design: Crafting intuitive and visually stunning interfaces with a focus on user experience and aesthetic excellence.",
    username: "Service 01",
    image: "/3d/3d1.png",
  },
  {
    text: "Frontend Development: Building responsive, high-performance web applications using modern frameworks and pixel-perfect implementation.",
    username: "Service 02",
    image: "/3d/3d2.png",
  },
  {
    text: "Backend Development: Architecting robust, scalable server-side solutions and APIs to power seamless digital experiences.",
    username: "Service 03",
    image: "/3d/3d3.png",
  },
  {
    text: "Full-Stack Development: Delivering end-to-end solutions by bridging the gap between design, frontend, and backend architecture.",
    username: "Service 04",
    image: "/3d/3d4.png",
  },
  {
    text: "Creative Development: Pushing boundaries with immersive animations, 3D experiences, and interactive storytelling.",
    username: "Service 05",
    image: "/3d/3d5.png",
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
        const isLast = i === slidesData.length - 1;

        if (slideLeft < 0 && !isLast) {
          const ratio = Math.min(1, Math.abs(slideLeft) / slideWidth);
          gsap.set(slide, {
            transformOrigin: "left 80%",
            x: -slide.offsetLeft + ratio * vwOffset,
            rotation: -15 * ratio,
            scale: 1 - ratio * 0.4,
            zIndex: i + 1,
            position: "relative",
          });
        } else {
          gsap.set(slide, {
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
    <div id="services" ref={sectionRef} className="flex flex-col md:flex-row h-dvh w-full items-center gap-[4vw] md:gap-[2vw] overflow-hidden bg-background py-10 md:py-0">
      <div className="flex h-[35vh] md:h-full w-full md:w-1/2 flex-col items-start justify-center px-[8vw] md:px-[4vw] bg-background z-50 relative">
        <h2 className="text-[18vw] md:text-[14vw] leading-[.8] font-heading font-bold uppercase text-primary">
          Why <br /> me ?
        </h2>
        <p className="mt-4 w-full md:w-[80%] font-sans text-fluid-body font-medium text-zinc-500">
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
              className={`pointer-events-none flex h-[50vh] w-[80vw] md:h-[40vw] md:w-[30vw] shrink-0 flex-col justify-between rounded-[4vw] md:rounded-[2vw] border border-border/50 bg-foreground p-[6vw] md:p-[2vw] ${
                index < slidesData.length - 1 ? "mr-[4vw] md:mr-[2vw]" : ""
              }`}
            >
              <p className="font-sans text-fluid-body leading-relaxed font-medium text-background">
                {slide.text}
              </p>
              
              <div className="flex justify-center items-center my-3 shrink-0">
                <Image
                  src={slide.image}
                  alt={slide.username}
                  width={100}
                  height={100}
                  className="w-[18vw] h-[18vw] md:w-[7vw] md:h-[7vw] object-contain drop-shadow-2xl animate-pulse"
                />
              </div>

              <h3 className="font-subheading text-fluid-subheading font-medium text-primary uppercase">
                {slide.username}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Swiper;


