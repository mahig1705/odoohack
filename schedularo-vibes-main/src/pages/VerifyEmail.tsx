import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const stateEmail = (location.state as any)?.email || "";
    if (stateEmail) setEmail(stateEmail);
  }, [location.state]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email required",
        description: "Please sign up again to receive the verification code.",
        variant: "destructive",
      });
      navigate("/signup");
      return;
    }

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.verifyOtp({ email, otp: otpCode });

      toast({
        title: "Email verified!",
        description: "Your account is now active. Welcome to Schedularo!",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resendVerificationOtp(email);
      toast({
        title: "Code resent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your email"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* EMAIL FIELD */}
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
              className="pl-10 h-12 border-2 rounded-xl"
              required
            />
          </div>
        </div>

        {/* OTP INPUTS */}
        <div className="space-y-2">
          <Label>OTP Code</Label>
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="
                  w-12 h-14 text-center text-2xl font-bold
                  border-2 border-foreground rounded-xl bg-background
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  transition-all
                "
              />
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          variant="doodle"
          className="w-full h-12"
          disabled={isLoading || otp.some((d) => !d)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>

        {/* RESEND + BACK */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="text-primary font-medium hover:underline"
            >
              Resend
            </button>
          </p>
          <Link to="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>

      </form>
    </AuthLayout>
  );
};

export default VerifyEmail;
