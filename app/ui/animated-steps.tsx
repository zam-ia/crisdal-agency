"use client";

import { motion, useReducedMotion } from "motion/react";

export function AnimatedSteps({
  steps,
}: {
  steps: Array<{ title: string; text: string }>;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className="mechanism-list">
      {steps.map((step, index) => (
        <motion.li
          key={step.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.28 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </motion.li>
      ))}
    </ol>
  );
}
