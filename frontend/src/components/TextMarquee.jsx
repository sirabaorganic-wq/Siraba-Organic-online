import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const TextMarquee = () => {
  const trackRef = useRef(null);
  const textStr = "HONESTY • INTEGRITY • PURITY • TRADITION";

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
        modifiers: {
          xPercent: gsap.utils.wrap(-50, 0),
        },
      });
    }, trackRef);

    return () => ctx.revert();
  }, []);

  const MarqueeText = () => (
    <span
      className="inline-block text-3xl md:text-4xl lg:text-5xl font-heading font-bold uppercase tracking-wide"
      style={{
        background:
          "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 12px rgba(16, 185, 129, 0.18))",
        opacity: 0.95,
      }}
    >
      {textStr.split("•").map((word, idx) => (
        <React.Fragment key={idx}>
          {word.trim()}
          {idx < textStr.split("•").length - 1 && (
            <span
              className="inline-block mx-4 md:mx-6 lg:mx-8 text-xl md:text-2xl lg:text-2xl"
              style={{
                opacity: 0.9,
                filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.12))",
              }}
            >
              •
            </span>
          )}
        </React.Fragment>
      ))}
    </span>
  );

  return (
    <div className="w-full relative overflow-hidden select-none pointer-events-none bg-gradient-to-b from-background via-background/97 to-background">
      {/* Top glowing border */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.5) 20%, rgba(16, 185, 129, 0.7) 50%, rgba(16, 185, 129, 0.5) 80%, transparent 100%)",
          boxShadow:
            "0 0 25px rgba(16, 185, 129, 0.4), 0 0 50px rgba(16, 185, 129, 0.2)",
        }}
      ></div>

      <div className="relative py-8 md:py-12 lg:py-16 overflow-hidden">
        <div
          ref={trackRef}
          className="flex whitespace-nowrap will-change-transform"
        >
          <div className="flex-shrink-0 px-10 md:px-14 lg:px-20">
            <MarqueeText />
          </div>
          <div className="flex-shrink-0 px-10 md:px-14 lg:px-20">
            <MarqueeText />
          </div>
        </div>

        {/* Left fade overlay */}
        <div
          className="absolute left-0 top-0 bottom-0 w-48 md:w-64 lg:w-80 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 15%, transparent 100%)",
          }}
        ></div>

        {/* Right fade overlay */}
        <div
          className="absolute right-0 top-0 bottom-0 w-48 md:w-64 lg:w-80 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 15%, transparent 100%)",
          }}
        ></div>
      </div>

      {/* Bottom glowing border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.5) 20%, rgba(16, 185, 129, 0.7) 50%, rgba(16, 185, 129, 0.5) 80%, transparent 100%)",
          boxShadow:
            "0 0 25px rgba(16, 185, 129, 0.4), 0 0 50px rgba(16, 185, 129, 0.2)",
        }}
      ></div>

      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
        }}
      ></div>
    </div>
  );
};

export default TextMarquee;
