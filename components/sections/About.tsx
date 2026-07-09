

import TextScramble from "../custom/text-scramble";



export default function About() {
  return (
    <section id="about" className="mt-20 min-h-[130dvh] md:min-h-dvh w-full">
      <div className="flex w-full flex-col items-center pt-20">
        <h2 className="font-heading text-fluid-heading font-black uppercase text-primary mb-8 tracking-wider">
          About
        </h2>
        <p className="max-w-4xl px-6 text-center font-sans text-fluid-body text-foreground/80 leading-relaxed">
          <TextScramble>
            Creates impactful digital experiences through design and frontend
            development, evolving from a foundation in design into specialized and
            modern frontend solutions that transform wireframes into refined,
            performance-driven experiences.
          </TextScramble>
        </p>
      </div>

      {/* Landing spot for ProfileCard scroll animation */}
      <div id="card-landing" className="mt-8 flex w-full justify-center">
        {/* ProfileCard will visually land here via ScrollTrigger */}
      </div>
    </section>
  );
}
