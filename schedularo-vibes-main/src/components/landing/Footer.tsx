import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Twitter, Linkedin, Instagram, Mail } from "lucide-react";
import { DoodleScribble } from "@/components/doodles";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Industries", href: "#industries" },
    { name: "Integrations", href: "#" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Contact", href: "#" },
    { name: "Status", href: "#" },
    { name: "API Docs", href: "#" },
  ],
  legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Cookies", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Mail, href: "#", label: "Email" },
];

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-10 right-10 w-16 h-16 opacity-20">
        <DoodleScribble variant="spiral" className="w-full h-full" color="hsl(var(--primary))" />
      </div>

      <div className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and description */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
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
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              The modern scheduling platform that helps businesses grow. 
              Simple, powerful, and delightful.
            </p>
            
            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Schedularo. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for businesses worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};
