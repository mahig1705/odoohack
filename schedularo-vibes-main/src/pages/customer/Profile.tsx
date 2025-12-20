import { useState } from "react";
import { motion } from "framer-motion";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomerProfile = () => {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsLoading(true);

    try {
      await userApi.updateProfile({
        full_name: fullName,
        phone: phone,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              My Profile
            </h1>
            <p className="text-muted-foreground mt-2">Manage your account information</p>
          </motion.div>
        </div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-border rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 border-border rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      className="pl-10 h-12 border-border rounded-xl bg-secondary/50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-12 border-border rounded-xl"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
