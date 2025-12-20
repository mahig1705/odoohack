import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Briefcase, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DoodleCircle, DoodleUnderline } from "@/components/doodles";
import { z } from "zod";

type AppRole = "customer" | "organizer";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!acceptTerms) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    const validation = signupSchema.safeParse({ name, email, password });
    if (!validation.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, name, selectedRole);
    
    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Signup failed",
        description: message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    toast({
      title: "Account created!",
      description: "Please verify your email with the OTP sent to your inbox.",
    });
    
    // Redirect to verify email page with email
    navigate("/verify-email", { state: { email } });
    setIsLoading(false);
  };

  const roleOptions = [
    {
      value: "customer" as AppRole,
      label: "Customer",
      description: "Book appointments",
      icon: <Users className="w-6 h-6" />,
    },
    {
      value: "organizer" as AppRole,
      label: "Organizer",
      description: "Manage services & bookings",
      icon: <Briefcase className="w-6 h-6" />,
    },
  ];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your journey with Schedularo"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            Sign up as
            <DoodleUnderline className="w-16 h-2" />
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(option.value)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  selectedRole === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {selectedRole === option.value && (
                  <DoodleCircle className="absolute -top-2 -right-2 w-6 h-6 text-primary" />
                )}
                <div className="flex flex-col gap-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedRole === option.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}>
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`pl-10 h-12 border-2 rounded-xl ${errors.name ? "border-destructive" : "border-foreground"}`}
              required
            />
          </div>
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 h-12 border-2 rounded-xl ${errors.email ? "border-destructive" : "border-foreground"}`}
              required
            />
          </div>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 pr-10 h-12 border-2 rounded-xl ${errors.password ? "border-destructive" : "border-foreground"}`}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="flex items-start gap-3">
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </label>
        </div>

        <Button 
          type="submit" 
          variant="doodle" 
          className="w-full h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            `Create ${selectedRole === "organizer" ? "Organizer" : "Customer"} Account`
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
