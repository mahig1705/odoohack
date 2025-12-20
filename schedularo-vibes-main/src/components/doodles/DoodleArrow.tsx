import { motion } from "framer-motion";

interface DoodleArrowProps {
  className?: string;
  color?: string;
  delay?: number;
  direction?: "right" | "left" | "up" | "down" | "curved-right" | "curved-down";
}

export const DoodleArrow = ({ 
  className = "", 
  color = "hsl(var(--primary))",
  delay = 0,
  direction = "right"
}: DoodleArrowProps) => {
  const paths: Record<string, { path: string; arrow: string; viewBox: string }> = {
    right: {
      viewBox: "0 0 100 30",
      path: "M5 15 Q30 8, 55 15 T90 15",
      arrow: "M85 15 L95 15 M90 10 L95 15 L90 20"
    },
    left: {
      viewBox: "0 0 100 30",
      path: "M95 15 Q70 8, 45 15 T10 15",
      arrow: "M15 15 L5 15 M10 10 L5 15 L10 20"
    },
    up: {
      viewBox: "0 0 30 100",
      path: "M15 95 Q8 70, 15 45 T15 10",
      arrow: "M15 15 L15 5 M10 10 L15 5 L20 10"
    },
    down: {
      viewBox: "0 0 30 100",
      path: "M15 5 Q8 30, 15 55 T15 90",
      arrow: "M15 85 L15 95 M10 90 L15 95 L20 90"
    },
    "curved-right": {
      viewBox: "0 0 120 80",
      path: "M10 70 Q10 20, 60 20 T110 40",
      arrow: "M105 35 L115 40 L105 45"
    },
    "curved-down": {
      viewBox: "0 0 80 120",
      path: "M10 10 Q60 10, 60 60 T40 110",
      arrow: "M35 105 L40 115 L45 105"
    }
  };

  const { path, arrow, viewBox } = paths[direction];

  return (
    <motion.svg
      viewBox={viewBox}
      className={`${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <motion.path
        d={path}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
      />
      <motion.path
        d={arrow}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.5 }}
      />
    </motion.svg>
  );
};
