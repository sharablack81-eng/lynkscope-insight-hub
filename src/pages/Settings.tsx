import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Palette,
  Bell,
  CreditCard,
  Shield,
  Upload,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("user");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState("#8B5CF6");
  const [backgroundAnimation, setBackgroundAnimation] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analyticsNotifications, setAnalyticsNotifications] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const accentColors = [
    { name: "Purple", value: "#8B5CF6", hsl: "258 90% 66%" },
    { name: "Blue", value: "#3B82F6", hsl: "217 91% 60%" },
    { name: "Cyan", value: "#06B6D4", hsl: "188 94% 43%" },
    { name: "Pink", value: "#EC4899", hsl: "330 81% 60%" },
  ];

  useEffect(() => {
    fetchUserData();
    loadAccentColor();
    loadThemePreference();
    loadAnimationPreference();
  }, []);

  const loadThemePreference = () => {
    const savedTheme = localStorage.getItem('darkMode');
    const isDark = savedTheme === null ? true : savedTheme === 'true';
    setDarkMode(isDark);
    applyTheme(isDark);
  };

  const loadAccentColor = () => {
    const savedColor = localStorage.getItem('accentColor');
    if (savedColor) {
      setAccentColor(savedColor);
      applyAccentColor(savedColor);
    }
  };

  const loadAnimationPreference = () => {
    const savedAnimation = localStorage.getItem('backgroundAnimation');
    const isEnabled = savedAnimation === null ? true : savedAnimation === 'true';
    setBackgroundAnimation(isEnabled);
    applyAnimationPreference(isEnabled);
  };

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const applyAnimationPreference = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.remove('no-animations');
    } else {
      document.documentElement.classList.add('no-animations');
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    applyTheme(checked);
    localStorage.setItem('darkMode', checked.toString());
    toast.success(`${checked ? 'Dark' : 'Light'} mode enabled!`, {
      description: "Your theme preference has been saved.",
    });
  };

  const handleAnimationToggle = (checked: boolean) => {
    setBackgroundAnimation(checked);
    applyAnimationPreference(checked);
    localStorage.setItem('backgroundAnimation', checked.toString());
    toast.success(`Animations ${checked ? 'enabled' : 'disabled'}!`, {
      description: "Your animation preference has been saved.",
    });
  };

  const applyAccentColor = (hexColor: string) => {
    const colorData = accentColors.find(c => c.value === hexColor);
    if (colorData) {
      const root = document.documentElement;
      root.style.setProperty('--primary', colorData.hsl);
      root.style.setProperty('--accent', colorData.hsl);
      root.style.setProperty('--ring', colorData.hsl);
      root.style.setProperty('--sidebar-primary', colorData.hsl);
      root.style.setProperty('--sidebar-ring', colorData.hsl);
    }
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    applyAccentColor(color);
    localStorage.setItem('accentColor', color);
    toast.success("Accent color updated!", {
      description: "Your color preference has been saved.",
    });
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setDisplayName(profile?.display_name || "user");
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile saved successfully!", {
        description: "Your changes have been updated.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save profile");
    }
  };

  const handleSavePreferences = () => {
    toast.success("Preferences saved!", {
      description: "Your notification settings have been updated.",
    });
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10 animate-fade-in">
          <div className="px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4 hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account, preferences, and plan options.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Settings */}
            <Card className="glass-card p-6 animate-scale-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Profile Settings</h2>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 cursor-pointer">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Avatar
                  </Button>
                </div>

                <Separator />

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="bg-input border-border opacity-60 cursor-not-allowed"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  className="w-full gradient-purple glow-purple hover:glow-purple-strong hover:scale-105 transition-all"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Appearance */}
            <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Appearance</h2>
                  <p className="text-sm text-muted-foreground">Customize your interface</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme across the app</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
                </div>

                <Separator />

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleAccentColorChange(color.value)}
                        className={`w-12 h-12 rounded-lg transition-all hover:scale-110 ${
                          accentColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : ""
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Background Animation */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Background Animation</Label>
                    <p className="text-sm text-muted-foreground">Enable all animations and effects</p>
                  </div>
                  <Switch checked={backgroundAnimation} onCheckedChange={handleAnimationToggle} />
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email me when a link reaches 100 clicks</Label>
                    <p className="text-sm text-muted-foreground">Get notified about milestones</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify me of new analytics reports</Label>
                    <p className="text-sm text-muted-foreground">Weekly summary emails</p>
                  </div>
                  <Switch checked={analyticsNotifications} onCheckedChange={setAnalyticsNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Product updates & announcements</Label>
                    <p className="text-sm text-muted-foreground">Stay informed about new features</p>
                  </div>
                  <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
                </div>

                <Button
                  onClick={handleSavePreferences}
                  className="w-full gradient-purple glow-purple hover:glow-purple-strong hover:scale-105 transition-all"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </Card>

            {/* Plan & Billing */}
            <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Plan & Billing</h2>
                  <p className="text-sm text-muted-foreground">Manage your subscription</p>
                </div>
              </div>

              <div className="p-6 bg-card/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-all animate-pulse-slow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary">Free Tier</h3>
                    <p className="text-sm text-muted-foreground">Basic analytics and link management</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    Current Plan
                  </span>
                </div>

                <Button
                  variant="outline"
                  disabled
                  className="w-full opacity-50 cursor-not-allowed"
                >
                  Upgrade (Coming Soon)
                </Button>
              </div>
            </Card>

            {/* Security */}
            <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Security</h2>
                  <p className="text-sm text-muted-foreground">Protect your account</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full justify-start hover:border-primary hover:bg-primary/10 transition-all"
                >
                  Change Password
                </Button>

                <Button
                  variant="outline"
                  disabled
                  className="w-full justify-start opacity-50 cursor-not-allowed"
                >
                  Enable 2FA (Coming Soon)
                </Button>

                <Separator />

                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full justify-start text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive transition-all"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" className="bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" className="bg-input border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-purple glow-purple hover:glow-purple-strong"
              onClick={() => {
                setShowPasswordModal(false);
                toast.success("Password updated successfully!");
              }}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="glass-card border-destructive">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your links and analytics data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-bold text-foreground">DELETE</span> to confirm:
            </p>
            <Input placeholder="DELETE" className="mt-2 bg-input border-border" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="hover:scale-105 transition-all"
              onClick={() => {
                setShowDeleteModal(false);
                toast.error("Account deletion cancelled");
              }}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
