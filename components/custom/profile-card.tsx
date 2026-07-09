import useDateAndTime from "@/lib/useDateAndTime";
import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ProfileCard() {
  const { year } = useDateAndTime();
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const images = [
    { id: 1, url: "/3d/3d1.png", x: -280, y: -250, r: -15 },
    { id: 2, url: "/3d/3d2.png", x: 180, y: -70, r: 20 },
    { id: 3, url: "/3d/3d3.png", x: -320, y: 50, r: -10 },
    { id: 4, url: "/3d/3d4.png", x: 320, y: 120, r: 85 },
    { id: 5, url: "/3d/3d5.png", x: -150, y: 230, r: -25 },
    { id: 6, url: "/3d/3d6.png", x: 180, y: -320, r: 10 },
  ];

  const ticketMask = {
    maskImage:
      "radial-gradient(circle at 0% 59%, transparent 8px, black 8px), radial-gradient(circle at 100% 59%, transparent 8px, black 8px)",
    maskComposite: "intersect",
    WebkitMaskComposite: "destination-in",
  }

  const handleMouseEnter = () => {
  imageRefs.current.forEach((el, i) => {
    if (!el) return;
    gsap.killTweensOf(el); // ✅ kill before re-animating
    gsap.to(el, {
      x: images[i].x,
      y: images[i].y,
      rotation: images[i].r,
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.4)",
      delay: i * 0.06,
    });
  });
};

const handleMouseLeave = () => {
  imageRefs.current.forEach((el) => {
    if (!el) return;
    gsap.killTweensOf(el); // ✅ kill before re-animating
    gsap.to(el, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 0,
      scale: 0.4,
      duration: 0.4,
      ease: "power2.in",
    });
  });
};

  useGSAP(()=>{
    gsap.fromTo(cardRef.current,{yPercent:8}, {yPercent:-8,ease:"sine.inOut", yoyo:true, repeat:-1, duration:1.5})
  },[])


  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Wrapper ties card + floating images together */}
      <div
        className="relative flex items-center justify-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 3D floating images — start collapsed at center */}
        {images.map((img, i) => (
          <div
            key={img.id}
            ref={(el) => { imageRefs.current[i] = el; }}
            className="absolute z-50 pointer-events-none opacity-0"
            style={{ transform: "translate(0px, 0px) rotate(0deg) scale(0.4)" }}
          >
            <Image
              src={img.url}
              alt="deco"
              width={50}
              height={50}
              className="drop-shadow-2xl"
            />
          </div>
        ))}

        {/* Card */}
        <div
          ref={cardRef}
          style={ticketMask}
          className="select-none relative flex flex-col items-center bg-foreground border border-border shadow-lg w-56 h-90 pt-5 pb-4 px-4 gap-3"
        >
          

          {/* Photo */}
          <div className="border-2 border-border rounded-sm overflow-hidden w-36 h-42 mt-2">
            <Image
              src="/photo.png"
              alt="Subhajit Choudhury"
              width={400}
              height={400}
              className="w-full h-full object-cover grayscale"
            />
          </div>


          {/* Dashed divider */}
          <div className="w-full border-t border-dashed border-background my-1" />

          {/* Barcode */}
          <div className="w-full px-1 mt-5">
            <Image
              src="/barcode.png"
              alt="barcode"
              width={400}
              height={40}
              className="h-8 w-full object-cover grayscale"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between w-full px-3 ">
            <span className="font-subheading text-[10px] uppercase tracking-wider text-muted-foreground">
              Coded by Subhajit.
            </span>
            <span className="font-subheading text-[10px] text-muted-foreground">{year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}