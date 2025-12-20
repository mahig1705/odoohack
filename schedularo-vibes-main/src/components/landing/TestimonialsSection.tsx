import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { FloatingDoodle, DoodleScribble } from "@/components/doodles";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Yoga Studio Owner",
    content: "Schedularo transformed how I run my studio. Bookings increased by 40% in the first month!",
    rating: 5,
  },
  {
    name: "Dr. Michael Chen",
    role: "Dental Clinic",
    content: "The automated reminders alone have saved us hours each week. No more no-shows!",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Hair Salon",
    content: "My clients love how easy it is to book online. It's been a game-changer for my business.",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-muted relative overflow-hidden">
      <FloatingDoodle className="absolute top-10 left-10 w-16 h-16 opacity-30" delay={0}>
        <DoodleScribble variant="star" className="w-full h-full" color="hsl(var(--primary))" />
      </FloatingDoodle>
      
      <FloatingDoodle className="absolute bottom-10 right-20 w-20 h-8 opacity-30" delay={1}>
        <DoodleScribble variant="wave" className="w-full h-full" color="hsl(var(--accent))" />
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
            What Our Users Say
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="text-primary">Thousands</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30, rotate: index % 2 === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -2 : 2 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ 
                rotate: 0, 
                scale: 1.02,
                transition: { duration: 0.2 } 
              }}
              className="group"
            >
              <div className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-doodle hover:shadow-doodle-lg transition-all duration-300 relative">
                {/* Quote icon */}
                <Quote className="w-10 h-10 text-primary/20 absolute top-4 right-4" />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-primary fill-primary" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-foreground mb-6 font-medium italic relative z-10">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="font-display font-bold text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-display font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                {/* Polaroid effect */}
                <div className="absolute inset-x-2 -bottom-2 h-4 bg-card border-2 border-foreground rounded-b-xl -z-10" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
