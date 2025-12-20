import { motion } from "framer-motion";

interface DoodleUnderlineProps {
  className?: string;
  color?: string;
  delay?: number;
}

export const DoodleUnderline = ({ 
  className = "", 
  color = "hsl(var(--primary))",
  delay = 0 
}: DoodleUnderlineProps) => {
  return (
    <motion.svg
      viewBox="0 0 200 12"
      className={`absolute -bottom-2 left-0 w-full h-3 ${className}`}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      <motion.path
        d="M2 6 Q40 2, 80 6 T160 6 T198 6"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
      />
    </motion.svg>
  );
};
