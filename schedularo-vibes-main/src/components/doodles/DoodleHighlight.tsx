import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DoodleHighlightProps {
  children: ReactNode;
  className?: string;
  color?: string;
  delay?: number;
}

export const DoodleHighlight = ({ 
  children,
  className = "", 
  color = "hsl(var(--primary) / 0.2)",
  delay = 0 
}: DoodleHighlightProps) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <motion.span
        className="absolute inset-0 -inset-x-2 -inset-y-1 -z-10"
        style={{ 
          background: color,
          borderRadius: "45% 55% 50% 50% / 55% 45% 55% 45%"
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
      />
      {children}
    </span>
  );
};
