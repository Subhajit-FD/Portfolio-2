

import TextScramble from "../custom/text-scramble";



export default function About() {
  return (
    <section className="mt-20 min-h-[130dvh] md:min-h-dvh w-full">
      <div className="flex w-full justify-center pt-20">
        <TextScramble className="max-w-7xl px-6 text-center text-3xl md:text-4xl">
          Creates impactful digital experiences through design and frontend
          development, evolving from a foundation in design into specialized and
          modern frontend solutions that transform wireframes into refined,
          performance-driven experiences.
        </TextScramble>
      </div>

      {/* Landing spot for ProfileCard scroll animation */}
      <div id="card-landing" className="mt-8 flex w-full justify-center">
        {/* ProfileCard will visually land here via ScrollTrigger */}
      </div>
    </section>
  );
}
