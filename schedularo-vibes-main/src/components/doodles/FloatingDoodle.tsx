import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingDoodleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  rotate?: number;
}

export const FloatingDoodle = ({ 
  children,
  className = "", 
  delay = 0,
  duration = 6,
  y = 15,
  rotate = 5
}: FloatingDoodleProps) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -y, 0, y / 2, 0],
        rotate: [0, rotate, 0, -rotate / 2, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};
