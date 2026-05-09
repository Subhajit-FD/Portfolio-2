"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"

gsap.registerPlugin(DrawSVGPlugin, useGSAP)

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

// ─── ThemeToggle ───────────────────────────────────────────────────────────────

export const ThemeToggle = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"))

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const applyTheme = () => {
      const newTheme = !isDark
      setIsDark(newTheme)
      document.documentElement.classList.toggle("dark")
      localStorage.setItem("theme", newTheme ? "dark" : "light")
    }

    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })

    transition?.ready?.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }, [isDark, duration])

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(buttonVariants({ variant: "outline", size: "icon" }), className)}
      {...props}
    >
      <SolarSwitch isDark={isDark} duration={duration / 1000} />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

// ─── Path data ─────────────────────────────────────────────────────────────────

const MOON_PATH =
  "M21.1918 13.2013C21.0345 14.9035 20.3957 16.5257 19.35 17.8781C18.3044 19.2305 16.8953 20.2571 15.2875 20.8379C13.6797 21.4186 11.9398 21.5294 10.2713 21.1574C8.60281 20.7854 7.07479 19.9459 5.86602 18.7371C4.65725 17.5283 3.81774 16.0003 3.4457 14.3318C3.07367 12.6633 3.18451 10.9234 3.76526 9.31561C4.346 7.70783 5.37263 6.29868 6.72501 5.25307C8.07739 4.20746 9.69959 3.56862 11.4018 3.41132C10.4052 4.75958 9.92564 6.42077 10.0503 8.09273C10.175 9.76469 10.8957 11.3364 12.0812 12.5219C13.2667 13.7075 14.8384 14.4281 16.5104 14.5528C18.1823 14.6775 19.8435 14.1979 21.1918 13.2013Z"

// ─── SolarSwitch ───────────────────────────────────────────────────────────────

const SolarSwitch = ({ isDark, duration }: { isDark: boolean; duration: number }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  // Tracks whether GSAP has set the initial state yet. We use a ref (not state)
  // so it never triggers a re-render.
  const isMounted = useRef(false)

  useGSAP(
    () => {
      if (!svgRef.current) return

      const sun = svgRef.current.querySelector<SVGGElement>(".sun-group")
      const moon = svgRef.current.querySelector<SVGPathElement>(".moon-path")
      const sunPaths = gsap.utils.toArray<SVGPathElement>(".sun-path", svgRef.current)
      if (!sun || !moon) return

      // ── First render: set initial state immediately with no animation ───────
      if (!isMounted.current) {
        isMounted.current = true
        if (isDark) {
          // Sun hidden, moon visible
          gsap.set(sun, { scale: 0, transformOrigin: "50% 50%" })
          gsap.set(sunPaths, { drawSVG: "0%" })
          gsap.set(moon, { scale: 1, transformOrigin: "50% 50%", drawSVG: "100%" })
        } else {
          // Sun visible, moon hidden
          gsap.set(sun, { scale: 1, transformOrigin: "50% 50%" })
          gsap.set(sunPaths, { drawSVG: "100%" })
          gsap.set(moon, { scale: 0, transformOrigin: "50% 50%", drawSVG: "0%" })
        }
        return
      }

      // ── Subsequent renders: animate the transition ───────────────────────────
      //
      // The original Framer Motion animation used pathLength (0→1) gated behind
      // a scale threshold of 0.6, meaning strokes only started drawing once the
      // element was at 60% of its full scale. We replicate this by:
      //   • Scaling from 0→1 over the full duration
      //   • Delaying the drawSVG start by 40% of the duration (i.e. when scale
      //     passes ~0.6) using a nested tween on the same timeline position.
      //
      // The draw therefore runs from (duration * 0.4) → duration, which is
      // exactly 60% of the total — matching the original `[0.6, 1]` transform.

      const drawDelay = duration * 0.4

      const tl = gsap.timeline()

      if (isDark) {
        // Light → Dark: shrink + undraw sun, grow + draw moon
        tl
          .to(
            sun,
            {
              scale: 0,
              duration,
              ease: "power2.inOut",
              transformOrigin: "50% 50%",
            },
            0
          )
          .to(
            sunPaths,
            {
              drawSVG: "0%",
              duration: duration * 0.6,
              ease: "power2.inOut",
            },
            0 // starts immediately; sun is already near full scale going down
          )
          .fromTo(
            moon,
            { scale: 0, drawSVG: "0%", transformOrigin: "50% 50%" },
            {
              scale: 1,
              duration,
              ease: "power2.inOut",
            },
            0
          )
          .to(
            moon,
            {
              drawSVG: "100%",
              duration: duration * 0.6,
              ease: "power2.inOut",
            },
            drawDelay // delayed start so drawing begins when scale ~ 0.6
          )
      } else {
        // Dark → Light: shrink + undraw moon, grow + draw sun
        tl
          .to(
            moon,
            {
              scale: 0,
              duration,
              ease: "power2.inOut",
              transformOrigin: "50% 50%",
            },
            0
          )
          .to(
            moon,
            {
              drawSVG: "0%",
              duration: duration * 0.6,
              ease: "power2.inOut",
            },
            0
          )
          .fromTo(
            sun,
            { scale: 0, transformOrigin: "50% 50%" },
            {
              scale: 1,
              duration,
              ease: "power2.inOut",
            },
            0
          )
          .fromTo(
            sunPaths,
            { drawSVG: "0%" },
            {
              drawSVG: "100%",
              duration: duration * 0.6,
              ease: "power2.inOut",
            },
            drawDelay
          )
      }

      // Clean up the timeline if the component unmounts mid-animation
      return () => tl.kill()
    },
    { scope: svgRef, dependencies: [isDark, duration] }
  )

  return (
    <svg
      ref={svgRef}
      width="20"
      height="20"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun — grouped so scale animates from the group's centre */}
      <g className="sun-group" style={{ transformOrigin: "50% 50%" }}>
        <path
          className="sun-path"
          d="M12.4058 17.7625C15.1672 17.7625 17.4058 15.5239 17.4058 12.7625C17.4058 10.0011 15.1672 7.76251 12.4058 7.76251C9.64434 7.76251 7.40576 10.0011 7.40576 12.7625C7.40576 15.5239 9.64434 17.7625 12.4058 17.7625Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M12.4058 1.76251V3.76251"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M12.4058 21.7625V23.7625"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M4.62598 4.98248L6.04598 6.40248"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M18.7656 19.1225L20.1856 20.5425"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M1.40576 12.7625H3.40576"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M21.4058 12.7625H23.4058"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M4.62598 20.5425L6.04598 19.1225"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="sun-path"
          d="M18.7656 6.40248L20.1856 4.98248"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Moon */}
      <path
        className="moon-path"
        d={MOON_PATH}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
