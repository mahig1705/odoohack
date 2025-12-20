import { motion } from "framer-motion";

interface DoodleScribbleProps {
  className?: string;
  color?: string;
  delay?: number;
  variant?: "zigzag" | "wave" | "spiral" | "star" | "dots" | "cross";
}

export const DoodleScribble = ({ 
  className = "", 
  color = "hsl(var(--primary))",
  delay = 0,
  variant = "zigzag"
}: DoodleScribbleProps) => {
  const variants: Record<string, { viewBox: string; path: string }> = {
    zigzag: {
      viewBox: "0 0 100 40",
      path: "M5 20 L20 5 L35 35 L50 5 L65 35 L80 5 L95 20"
    },
    wave: {
      viewBox: "0 0 100 40",
      path: "M5 20 Q15 5, 25 20 T45 20 T65 20 T85 20 T95 20"
    },
    spiral: {
      viewBox: "0 0 60 60",
      path: "M30 30 Q35 25, 35 30 Q35 35, 30 35 Q20 35, 20 25 Q20 15, 35 15 Q50 15, 50 35 Q50 50, 25 50"
    },
    star: {
      viewBox: "0 0 50 50",
      path: "M25 5 L30 18 L45 18 L33 28 L38 43 L25 33 L12 43 L17 28 L5 18 L20 18 Z"
    },
    dots: {
      viewBox: "0 0 100 20",
      path: "M10 10 L11 10 M30 10 L31 10 M50 10 L51 10 M70 10 L71 10 M90 10 L91 10"
    },
    cross: {
      viewBox: "0 0 40 40",
      path: "M5 5 L35 35 M35 5 L5 35"
    }
  };

  const { viewBox, path } = variants[variant];

  return (
    <motion.svg
      viewBox={viewBox}
      className={`${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.path
        d={path}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
      />
    </motion.svg>
  );
};
