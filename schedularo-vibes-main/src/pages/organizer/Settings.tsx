import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { OrganizerLayout } from "@/components/layout/OrganizerLayout";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Save, User, Mail, Phone } from "lucide-react";

const SettingsPage = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone("");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await userApi.updateProfile({ full_name: fullName, phone });
      toast({ title: "Saved!", description: "Profile updated successfully" });
      await refreshProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: error.message || "Failed to save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-display text-2xl font-bold">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </OrganizerLayout>
  );
};

export default SettingsPage;
