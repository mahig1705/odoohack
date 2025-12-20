import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DoodleArrow, FloatingDoodle, DoodleScribble, DoodleHighlight } from "@/components/doodles";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-24 bg-secondary relative overflow-hidden">
      {/* Background decorations */}
      <FloatingDoodle className="absolute top-10 left-10 w-20 h-20 opacity-20" delay={0}>
        <DoodleScribble variant="star" className="w-full h-full" color="hsl(var(--secondary-foreground))" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute bottom-10 right-10 w-24 h-10 opacity-20" delay={0.5}>
        <DoodleScribble variant="zigzag" className="w-full h-full" color="hsl(var(--primary))" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute top-1/2 left-5 w-16 h-16 opacity-15" delay={1}>
        <DoodleScribble variant="spiral" className="w-full h-full" color="hsl(var(--secondary-foreground))" />
      </FloatingDoodle>

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground rounded-full px-4 py-2 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium text-secondary-foreground">No credit card required</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-foreground mb-6">
            Ready to{" "}
            <DoodleHighlight color="hsl(var(--primary) / 0.3)">
              <span className="text-primary">Transform</span>
            </DoodleHighlight>
            {" "}Your Scheduling?
          </h2>
          
          <p className="text-lg text-secondary-foreground/80 mb-10">
            Join thousands of businesses that trust Schedularo to manage their appointments.
            Start your free trial today.
          </p>

          <div className="relative inline-block">
            {/* Doodle arrow pointing to button */}
            <FloatingDoodle className="absolute -left-20 -top-8 w-16 h-12 hidden md:block" delay={0.5}>
              <DoodleArrow direction="curved-right" className="w-full h-full" color="hsl(var(--primary))" />
            </FloatingDoodle>

            <Link to="/signup">
              <Button variant="hero" size="xl" className="bg-primary hover:bg-primary/90">
                Create Your Free Account
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-secondary-foreground/60">
            14-day free trial · No credit card · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};
