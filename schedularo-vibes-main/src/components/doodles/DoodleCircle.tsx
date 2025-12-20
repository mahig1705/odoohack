import { motion } from "framer-motion";

interface DoodleCircleProps {
  className?: string;
  color?: string;
  delay?: number;
}

export const DoodleCircle = ({ 
  className = "", 
  color = "hsl(var(--primary))",
  delay = 0 
}: DoodleCircleProps) => {
  return (
    <motion.svg
      viewBox="0 0 120 60"
      className={`absolute ${className}`}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1, delay, ease: "easeOut" }}
    >
      <motion.ellipse
        cx="60"
        cy="30"
        rx="55"
        ry="25"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
        style={{ 
          transform: "rotate(-3deg)",
          transformOrigin: "center"
        }}
      />
    </motion.svg>
  );
};
