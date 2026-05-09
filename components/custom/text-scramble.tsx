"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

const scrambleChars =
  "▙ ▚ ▞ a k i e d z e k ▝ ▀ ▖ ▜ ▛ ▟ ▙ ▚ ▞ ▝ ▀ ▖ a k i e d z e k";

interface TextScrambleProps {
  children: string;
  className?: string;
}

export default function TextScramble({ children, className }: TextScrambleProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: textRef.current,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to(textRef.current, {
            duration: 1.2,
            scrambleText: {
              text: children,
              chars: scrambleChars,
              revealDelay: 0.3,
              speed:1.5
            },
          });
        },
      });
    });

    return () => ctx.revert();
  }, [children]);

  return (
    <span ref={textRef} className={className}>
      {children}
    </span>
  );
}