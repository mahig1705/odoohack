import { motion } from "framer-motion";
import { FloatingDoodle, DoodleScribble } from "@/components/doodles";

const logos = [
  { name: "FitLife", text: "FitLife" },
  { name: "EduPro", text: "EduPro" },
  { name: "HealthPlus", text: "HealthPlus" },
  { name: "SportZone", text: "SportZone" },
  { name: "BeautyHub", text: "BeautyHub" },
  { name: "MediCare", text: "MediCare" },
];

export const TrustSection = () => {
  return (
    <section className="py-16 bg-muted relative overflow-hidden">
      <FloatingDoodle className="absolute top-4 right-10 w-8 h-8 opacity-40" delay={0}>
        <DoodleScribble variant="star" className="w-full h-full" />
      </FloatingDoodle>

      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by thousands
          </p>
          <h3 className="font-display text-2xl font-bold mt-2">
            Powering scheduling for <span className="text-primary">10,000+</span> businesses
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="font-display font-bold text-xl md:text-2xl text-muted-foreground/60 group-hover:text-foreground transition-colors">
                {logo.text}
              </div>
              {/* Doodle checkmark on hover */}
              <motion.svg
                viewBox="0 0 24 24"
                className="absolute -right-4 -top-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
              >
                <motion.path
                  d="M4 12 L10 18 L20 6"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.svg>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
