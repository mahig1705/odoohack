import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar } from "lucide-react";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Industries", href: "#industries" },
  { name: "Pricing", href: "#pricing" },
  { name: "About", href: "#about" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border"
    >
      <nav className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md"
          >
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <span className="font-display font-bold text-xl">
            Schedul<span className="text-primary">aro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {isLanding && navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="default" size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        className="md:hidden overflow-hidden bg-background border-b border-border"
      >
        <div className="container px-4 py-4 flex flex-col gap-4">
          {isLanding && navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full">
                Log in
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setIsOpen(false)}>
              <Button variant="default" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
};
