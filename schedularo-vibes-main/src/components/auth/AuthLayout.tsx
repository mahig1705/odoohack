import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { FloatingDoodle, DoodleScribble } from "@/components/doodles";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <FloatingDoodle className="absolute top-10 left-10 w-12 h-12 opacity-30" delay={0}>
          <DoodleScribble variant="star" className="w-full h-full" />
        </FloatingDoodle>
        
        <FloatingDoodle className="absolute bottom-20 right-10 w-16 h-8 opacity-30" delay={1}>
          <DoodleScribble variant="wave" className="w-full h-full" color="hsl(var(--accent))" />
        </FloatingDoodle>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"
            >
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="font-display font-bold text-xl">
              Schedul<span className="text-primary">aro</span>
            </span>
          </Link>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {title}
          </h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>

          {children}
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-8 relative overflow-hidden">
        <FloatingDoodle className="absolute top-20 right-20 w-24 h-24 opacity-20" delay={0}>
          <DoodleScribble variant="spiral" className="w-full h-full" color="hsl(var(--secondary-foreground))" />
        </FloatingDoodle>
        
        <FloatingDoodle className="absolute bottom-20 left-20 w-32 h-12 opacity-20" delay={0.5}>
          <DoodleScribble variant="zigzag" className="w-full h-full" color="hsl(var(--primary))" />
        </FloatingDoodle>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center max-w-md relative z-10"
        >
          <div className="w-32 h-32 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Calendar className="w-16 h-16 text-primary-foreground" />
          </div>
          <h2 className="font-display text-3xl font-bold text-secondary-foreground mb-4">
            Scheduling made simple
          </h2>
          <p className="text-secondary-foreground/80">
            Join thousands of businesses that trust Schedularo to manage their appointments effortlessly.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
