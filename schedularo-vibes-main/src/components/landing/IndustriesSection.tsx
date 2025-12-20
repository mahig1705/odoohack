import { motion } from "framer-motion";
import { Dumbbell, GraduationCap, Trophy, Sparkles, Stethoscope } from "lucide-react";
import { FloatingDoodle, DoodleScribble, DoodleArrow } from "@/components/doodles";

const industries = [
  {
    icon: Dumbbell,
    name: "Fitness & Health",
    description: "Gyms, yoga studios, personal trainers",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    icon: GraduationCap,
    name: "Education",
    description: "Tutors, schools, coaching centers",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: Trophy,
    name: "Sports",
    description: "Courts, fields, sports academies",
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    icon: Sparkles,
    name: "Salon & Spa",
    description: "Hair salons, spas, beauty services",
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  },
  {
    icon: Stethoscope,
    name: "Medical Clinics",
    description: "Doctors, dentists, therapists",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
];

export const IndustriesSection = () => {
  return (
    <section id="industries" className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <FloatingDoodle className="absolute top-20 left-10 w-20 h-8 opacity-30" delay={0}>
        <DoodleScribble variant="wave" className="w-full h-full" color="hsl(var(--primary))" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute bottom-20 right-10 w-12 h-12 opacity-30" delay={1}>
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
            Industries We Serve
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="text-primary">Every</span> Business
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're a solo practitioner or a multi-location enterprise, 
            Schedularo adapts to your unique needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {/* Arrow pointing to cards */}
          <FloatingDoodle className="absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 hidden xl:block" delay={0.5}>
            <DoodleArrow direction="right" className="w-full h-full" />
          </FloatingDoodle>

          {industries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ 
                y: -8, 
                rotate: index % 2 === 0 ? 2 : -2,
                transition: { duration: 0.2 }
              }}
              className="group relative"
            >
              <div className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-doodle hover:shadow-doodle-lg transition-all duration-300 h-full">
                {/* Animated border on hover */}
                <motion.div
                  className="absolute inset-0 border-2 border-primary rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    borderRadius: "45% 55% 50% 50% / 55% 45% 55% 45%",
                  }}
                  animate={{
                    borderRadius: [
                      "45% 55% 50% 50% / 55% 45% 55% 45%",
                      "55% 45% 55% 45% / 45% 55% 45% 55%",
                      "45% 55% 50% 50% / 55% 45% 55% 45%",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className={`w-14 h-14 rounded-xl ${industry.color} flex items-center justify-center mb-4`}>
                  <industry.icon className="w-7 h-7" />
                </div>
                
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {industry.name}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  {industry.description}
                </p>

                {/* Doodle decoration */}
                <motion.div
                  className="absolute -bottom-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <DoodleScribble variant="star" className="w-full h-full" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
