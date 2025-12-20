import { motion } from "framer-motion";
import { CalendarPlus, Share, Rocket } from "lucide-react";
import { DoodleArrow, FloatingDoodle, DoodleScribble } from "@/components/doodles";

const steps = [
  {
    number: "01",
    icon: CalendarPlus,
    title: "Add Your Availability",
    description: "Set your working hours, breaks, and holidays in minutes.",
  },
  {
    number: "02",
    icon: Share,
    title: "Share Your Booking Page",
    description: "Get a beautiful booking page to share with your clients.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Start Managing Appointments",
    description: "Watch bookings roll in while we handle the rest.",
  },
];

export const TimelineSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <FloatingDoodle className="absolute top-20 left-10 w-12 h-12 opacity-30" delay={0}>
        <DoodleScribble variant="spiral" className="w-full h-full" color="hsl(var(--accent))" />
      </FloatingDoodle>

      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            How It Works
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Get Started in <span className="text-primary">3 Simple Steps</span>
          </h2>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.2 }}
                className="relative"
              >
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <FloatingDoodle 
                    className="hidden md:block absolute -right-10 top-1/2 -translate-y-1/2 w-12 h-8 z-10"
                    delay={0.5 + index * 0.2}
                  >
                    <DoodleArrow direction="right" className="w-full h-full" />
                  </FloatingDoodle>
                )}

                <div className="text-center">
                  {/* Step number */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-20 h-20 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center shadow-glow relative z-10"
                  >
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </motion.div>

                  {/* Step number badge */}
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.2, type: "spring" }}
                    className="absolute top-0 right-1/2 translate-x-8 -translate-y-2 bg-secondary text-secondary-foreground font-display font-bold text-sm px-3 py-1 rounded-full"
                  >
                    {step.number}
                  </motion.span>

                  <h3 className="font-display font-bold text-xl mb-2">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
