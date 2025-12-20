import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { passwordApi } from "@/lib/api";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email");

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    try {
      await passwordApi.resetRequest(email);
      toast({
        title: "Email sent!",
        description: "Check your inbox for password reset instructions.",
      });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions to your email"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full h-12 border-2 border-foreground rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
              className={`pl-10 h-12 border-2 rounded-xl ${error ? "border-destructive" : "border-foreground"}`}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
              Sending...
            </>
          ) : (
            "Reset password"
          )}
        </Button>

        <Link to="/login" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
