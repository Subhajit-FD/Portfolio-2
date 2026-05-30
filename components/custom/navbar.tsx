"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "../ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { ISettings } from "@/lib/types";

export default function Navbar({ settings }: { settings?: ISettings | null }) {
  const pathname = usePathname();
  const links = [
    { id: 1, label: "Home", href: "/" },
    { id: 2, label: "Works", href: "/works" },
    { id: 3, label: "About", href: "#about" },
    { id: 4, label: "Contact", href: "#contact" },
  ];

  const socials = [
    { id: 1, label: "X/Twitter", href: settings?.twitterUrl || "#", icon: true },
    { id: 2, label: "LinkedIn", href: settings?.linkedinUrl || "#", icon: true },
    { id: 3, label: "Instagram", href: settings?.instagramUrl || "#", icon: true },
    { id: 4, label: "Behance", href: settings?.behanceUrl || "#", icon: true },
  ].filter(s => s.href && s.href !== "#");

  const email = settings?.email || "subhajitchoudhuryofficial@gmail.com";

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 relative">
      <div className="uppercase font-heading font-extrabold tracking-wider text-xl">
        <Link href="/">
          <h1>subhajit</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant={"outline"} className="flex items-center gap-2">
                <span>Menu</span>
              </Button>
            }
          />
          <SheetContent 
            side="right" 
            showCloseButton={false}
           className="w-full sm:max-w-md bg-foreground text-background border-l flex flex-col p-0 h-screen overflow-hidden"
          >
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-primary" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Menu
                </span>
              </div>
              <SheetClose render={<Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-foreground text-background hover:bg-foreground/80 hover:text-background border-none" />}>
                <X size={20} />
              </SheetClose>
            </div>

            {/* Scrollable Content */}
            <div 
              className="grow overflow-y-auto no-scrollbar min-h-0"
              data-lenis-prevent="true"
            >
              {/* Navigation */}
              <nav className="px-8 pt-4 pb-10 flex flex-col shrink-0">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      className={cn(
                        "group py-8 border-b border-background/50 flex items-center gap-4 transition-all hover:pl-4",
                        isActive ? "text-background" : "text-muted-foreground hover:text-background"
                      )}
                    >
                      <span className="text-xl font-heading font-black uppercase tracking-tighter">
                        {link.label}
                      </span>
                      {isActive && (
                        <div className="w-2 h-2 bg-primary shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-8 bg-foreground flex flex-col gap-10 shrink-0">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    (Email)
                  </span>
                  <Link 
                    href={`mailto:${email}`} 
                    className="text-xs md:text-lg font-heading font-bold text-primary hover:underline underline-offset-8 decoration-2"
                  >
                    {email}
                  </Link>
                </div>

                <div className="flex flex-col gap-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    (Socials)
                  </span>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                    {socials.map((social) => (
                      <Link 
                        key={social.id}
                        href={social.href}
                        className="group flex items-center justify-between text-lg font-medium pb-2 transition-colors hover:text-primary"
                      >
                        {social.label}
                        <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <ThemeToggle />
      </div>
    </div>
  );
}
