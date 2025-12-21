import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Mail, Loader2, ArrowLeft, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { passwordApi } from "@/lib/api";
import { z } from "zod";

const otpSchema = z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers");

const VerifyPasswordReset = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = otpSchema.safeParse(otp);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await passwordApi.verifyOtp(email, otp);
      toast({
        title: "OTP verified!",
        description: "Please set your new password.",
      });
      // Navigate to reset password page with reset token
      navigate("/reset-password", { state: { resetToken: result.reset_token } });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
      setError("Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle="Enter the 6-digit code sent to your email"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="pl-10 h-12 border-2 rounded-xl bg-muted"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">OTP Code</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              className={`pl-10 h-12 border-2 rounded-xl text-center text-2xl tracking-widest ${error ? "border-destructive" : "border-foreground"}`}
              maxLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button 
          type="submit" 
          variant="doodle" 
          className="w-full h-12"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>

        <Link to="/forgot-password" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
};

export default VerifyPasswordReset;

