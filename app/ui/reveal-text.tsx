"use client";

import { motion, useReducedMotion } from "motion/react";

function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return text.split(" ").map((word, index) => (
    <motion.span
      className="reveal-word"
      initial={{ opacity: 0, y: 22, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: reduceMotion ? 0 : 0.72,
        delay: reduceMotion ? 0 : delay + index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      key={`${word}-${index}`}
    >
      {word}
      {index < text.split(" ").length - 1 ? "\u00a0" : ""}
    </motion.span>
  ));
}

export function RevealText({
  title,
  accent,
}: {
  title: string;
  accent: string;
}) {
  return (
    <h1 id="hero-title" className="reveal-title">
      <span><Words text={title} /></span>
      <em><Words text={accent} delay={title.split(" ").length * 0.04} /></em>
    </h1>
  );
}
