import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeroCalendar } from "./HeroCalendar";
import { 
  DoodleUnderline, 
  DoodleCircle, 
  DoodleScribble, 
  DoodleArrow,
  DoodleHighlight,
  FloatingDoodle 
} from "@/components/doodles";
import { ChevronDown, Sparkles, Zap, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  isLoggedIn?: boolean;
  userName?: string;
  userRole?: string;
}

export const HeroSection = ({ isLoggedIn = false, userName, userRole }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute inset-0 scribble-bg opacity-50" />
      
      {/* Floating doodle decorations */}
      <FloatingDoodle className="absolute top-20 left-10 w-16 h-16 text-primary opacity-60" delay={0}>
        <DoodleScribble variant="star" className="w-full h-full" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute top-40 right-20 w-20 h-8 text-accent opacity-60" delay={0.5}>
        <DoodleScribble variant="zigzag" className="w-full h-full" color="hsl(var(--accent))" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute bottom-40 left-20 w-12 h-12 text-primary opacity-50" delay={1}>
        <DoodleScribble variant="spiral" className="w-full h-full" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute top-1/3 right-10 w-16 h-10 opacity-40" delay={1.5}>
        <DoodleScribble variant="wave" className="w-full h-full" color="hsl(var(--accent))" />
      </FloatingDoodle>

      <div className="container relative z-10 pt-24 pb-16 px-4">
        {/* Top tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">The #1 Scheduling Platform</span>
          </div>
          
          <h2 className="font-display text-xl md:text-2xl font-semibold text-muted-foreground relative inline-block">
            Appointment app – 
            <span className="relative">
              <span className="text-foreground"> The perfect </span>
              <DoodleCircle 
                className="-inset-2 w-[120%] h-[150%] -left-[10%] -top-[25%]" 
                delay={0.8}
              />
            </span>
            booking system
          </h2>
        </motion.div>

        {/* Personalized greeting for logged-in customers */}
        {isLoggedIn && userRole === "customer" && userName && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-6"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {userName}
            </h2>
          </motion.div>
        )}

        {/* Calendar component */}
        <HeroCalendar className="mb-12" isLoggedIn={isLoggedIn && userRole === "customer"} />

        {/* Main hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="relative inline-block">
              Book
              <DoodleUnderline className="!-bottom-4" delay={0.6} />
            </span>
            <span className="text-muted-foreground">.</span>
            {" "}
            <DoodleHighlight delay={0.8}>
              <span className="text-primary">Manage</span>
            </DoodleHighlight>
            <span className="text-muted-foreground">.</span>
            {" "}
            <span className="relative inline-block">
              Grow
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.4, type: "spring" }}
                className="absolute -right-8 -top-4"
              >
                <Zap className="w-8 h-8 text-primary fill-primary" />
              </motion.span>
            </span>
            <span className="text-primary">.</span>
          </h1>
          
          {!isLoggedIn && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Appointments made simple, for every business. 
              From fitness studios to medical clinics — we've got you covered.
            </motion.p>
          )}
          {isLoggedIn && userRole === "customer" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Manage your appointments, discover new services, and book your next session.
            </motion.p>
          )}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 relative"
        >
          {isLoggedIn && userRole === "customer" ? (
            <>
              <Link to="/customer/discover">
                <Button variant="hero" size="xl" className="group">
                  <Calendar className="w-5 h-5 mr-2" />
                  Discover Services
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Button>
              </Link>
              <Link to="/customer/bookings">
                <Button variant="hero-outline" size="xl">
                  My Bookings
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="relative">
                <Link to="/signup">
                  <Button variant="hero" size="xl" className="group">
                    <Calendar className="w-5 h-5 mr-2" />
                    Get Started Free
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </Button>
                </Link>
                <FloatingDoodle className="absolute -top-8 -right-12 w-16 h-12 hidden md:block" delay={1.5}>
                  <DoodleArrow direction="curved-down" className="w-full h-full" />
                </FloatingDoodle>
              </div>
              <Link to="/login">
                <Button variant="hero-outline" size="xl">
                  Login
                </Button>
              </Link>
            </>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col items-center"
        >
          <span className="text-sm text-muted-foreground mb-2">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-primary" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-muted to-transparent" />
    </section>
  );
};
