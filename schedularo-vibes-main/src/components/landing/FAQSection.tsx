import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FloatingDoodle, DoodleScribble } from "@/components/doodles";

const faqs = [
  {
    question: "Is there a free trial?",
    answer: "Yes! You can try Schedularo free for 14 days with all features included. No credit card required.",
  },
  {
    question: "Can I accept payments through Schedularo?",
    answer: "Absolutely! We integrate with Stripe, PayPal, and other major payment providers so you can accept payments at booking time.",
  },
  {
    question: "How do automated reminders work?",
    answer: "We send email and SMS reminders to your clients before their appointments. You can customize the timing and message content.",
  },
  {
    question: "Can I have multiple staff members?",
    answer: "Yes! Our team plans support unlimited staff members, each with their own availability and booking calendar.",
  },
  {
    question: "Is my data secure?",
    answer: "We use bank-level encryption and are fully GDPR compliant. Your data is stored securely in enterprise-grade data centers.",
  },
  {
    question: "Can I integrate with my existing tools?",
    answer: "We offer integrations with Google Calendar, Outlook, Zoom, Google Meet, and many more through our API and Zapier.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <FloatingDoodle className="absolute top-20 right-10 w-12 h-12 opacity-30" delay={0}>
        <DoodleScribble variant="spiral" className="w-full h-full" color="hsl(var(--primary))" />
      </FloatingDoodle>

      <div className="container px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Got Questions?
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left"
              >
                <div className={`
                  bg-card border-2 border-foreground rounded-xl p-5 
                  transition-all duration-300 shadow-sm
                  ${openIndex === index ? 'shadow-doodle' : 'hover:shadow-doodle'}
                `}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="font-display font-bold text-lg">
                        {faq.question}
                      </h3>
                    </div>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-muted-foreground mt-4 pl-8">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
