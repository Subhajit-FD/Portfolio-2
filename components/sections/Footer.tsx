"use client";

import useDateAndTime from "@/lib/useDateAndTime";
import TextScramble from "@/components/custom/text-scramble";
import { ArrowUpRightIcon } from "@phosphor-icons/react";

export default function Footer() {
  const { time, year } = useDateAndTime();
  const currentYear = year.toString();

  return (
    <footer className="w-full bg-background text-foreground px-6 py-10 md:px-12 md:py-16 border-t border-border overflow-hidden">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-12 md:gap-20">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          
          {/* Left Nav */}
          <div className="flex flex-col gap-4">
            <nav className="flex flex-col gap-2">
              {["ABOUT ME", "SERVICES", "WORKS"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="group w-fit">
                  <TextScramble className="text-sm font-mono tracking-widest transition-opacity group-hover:opacity-60">
                    {item}
                  </TextScramble>
                </a>
              ))}
            </nav>
          </div>

          {/* Right Contact & Social */}
          <div className="flex flex-col gap-8 md:text-right md:items-end">
            <div className="flex flex-col gap-1">
              <TextScramble className="text-lg md:text-4xl font-bold tracking-tight lowercase">
                subhajitchoudhuryofficial@gmail.com
              </TextScramble>
            </div>
            
            <div className="flex flex-wrap gap-6 md:gap-10">
              {["INSTAGRAM", "LINKEDIN"].map((social) => (
                <a key={social} href="#" className="flex items-center gap-1 group border-b border-foreground/30 pb-0.5">
                  <TextScramble className="text-sm font-mono tracking-widest group-hover:opacity-60">
                    {social}
                  </TextScramble>
                  <ArrowUpRightIcon size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Large Name */}
        <div className="w-full select-none overflow-hidden py-4">
          <h1 className="text-[12vw] md:text-[14vw] font-black leading-[0.8] tracking-widest uppercase whitespace-nowrap text-center text-primary">
            SUBHAJIT
          </h1>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-border/50">
          <div className="w-full md:w-1/3 flex justify-start">
            <p className="text-[10px] font-mono tracking-tighter text-muted-foreground uppercase">
              Kolkata, India: (GMT+5:30) {time}
            </p>
          </div>
          
          <div className="w-full md:w-1/3 flex justify-center">
             <TextScramble className="text-[10px] font-mono tracking-widest text-muted-foreground">
                {`DEVELOPMENT — ${currentYear}`}
             </TextScramble>
          </div>

          <div className="w-full md:w-1/3 flex justify-end text-right">
            <p className="text-[10px] font-mono text-muted-foreground leading-tight max-w-[200px]">
              © {year} All Rights Reserved. Subhajit Choudhury.<br />
              Any reproduction, distribution, or use of the materials without permission is prohibited.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
