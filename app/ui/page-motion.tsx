"use client";

import { animate, inView, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useEffect } from "react";

export function PageMotion() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 28,
    mass: 0.32,
  });

  useEffect(() => {
    if (reduceMotion) return;

    return inView(
      "[data-reveal]",
      (element) => {
        animate(
          element,
          { opacity: [0, 1], y: [24, 0], filter: ["blur(5px)", "blur(0px)"] },
          { duration: 0.68, ease: [0.22, 1, 0.36, 1] },
        );
      },
      { amount: 0.16, margin: "0px 0px -8% 0px" },
    );
  }, [reduceMotion]);

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
