import { motion } from "framer-motion";
import { 
  CalendarCheck, Clock, Bell, UserX, Users, Share2, 
  CreditCard, UserCircle, BarChart3, FileText 
} from "lucide-react";
import { FloatingDoodle, DoodleScribble, DoodleHighlight } from "@/components/doodles";

const features = [
  { icon: CalendarCheck, name: "Online Booking", description: "24/7 self-service booking" },
  { icon: Clock, name: "Calendar Scheduling", description: "Smart time management" },
  { icon: Bell, name: "Appointment Alerts", description: "Automatic reminders" },
  { icon: UserX, name: "No-Show Automation", description: "Reduce missed appointments" },
  { icon: Users, name: "Staff Management", description: "Team scheduling made easy" },
  { icon: Share2, name: "Multi-Channel", description: "Book from anywhere" },
  { icon: CreditCard, name: "Payment Integration", description: "Accept payments online" },
  { icon: UserCircle, name: "Customer Profiles", description: "Know your clients" },
  { icon: BarChart3, name: "Reports & Analytics", description: "Data-driven insights" },
  { icon: FileText, name: "Custom Forms", description: "Collect any information" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-muted relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 scribble-bg opacity-30" />
      
      <FloatingDoodle className="absolute top-10 right-20 w-16 h-16 opacity-40" delay={0}>
        <DoodleScribble variant="star" className="w-full h-full" color="hsl(var(--primary))" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute bottom-10 left-10 w-24 h-10 opacity-30" delay={1}>
        <DoodleScribble variant="zigzag" className="w-full h-full" color="hsl(var(--accent))" />
      </FloatingDoodle>

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Powerful Features
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <DoodleHighlight delay={0.3}>
              <span className="text-primary">Succeed</span>
            </DoodleHighlight>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From booking to analytics, we've built every feature you need 
            to run your scheduling like a pro.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ 
                y: -5, 
                rotate: [-1, 1, -1, 0][index % 4],
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <div className="bg-card border border-border rounded-xl p-4 md:p-6 h-full hover:border-primary hover:shadow-md transition-all duration-300 relative overflow-hidden">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary/20 transition-colors"
                >
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </motion.div>
                
                <h3 className="font-display font-bold text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                  {feature.name}
                </h3>
                
                <p className="text-xs md:text-sm text-muted-foreground">
                  {feature.description}
                </p>

                {/* Floating decoration on hover */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4"
                >
                  <DoodleScribble variant="star" className="w-full h-full" color="hsl(var(--primary))" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
