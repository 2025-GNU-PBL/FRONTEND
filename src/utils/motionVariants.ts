import type { Variants } from "framer-motion";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: EASE_OUT } },
};

export const stagger = (delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { delay, staggerChildren: 0.06, when: "beforeChildren" },
  },
});

export const dimVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 0.7, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } },
};

export const bottomSheetVariants: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: { y: "100%", transition: { duration: 0.26, ease: EASE_OUT } },
};
