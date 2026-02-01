import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useBusinessProfile } from "@/contexts/BusinessContext";
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
  CreditCard,
  Shield,
  Upload,
  Check,
  AlertTriangle,
  Sparkles,
  Crown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase, BACKEND_URL } from "@/lib/backend";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/subscription/UpgradeModal";

const Settings = () => {
  const navigate = useNavigate();
  const { status, daysRemaining, isLoading: subscriptionLoading } = useSubscription();
  const { businessName: contextBusinessName, businessNiche: contextBusinessNiche, refetch: refetchBusiness } = useBusinessProfile();
  const [businessName, setBusinessName] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [businessNameError, setBusinessNameError] = useState("");
  const [businessNicheError, setBusinessNicheError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState("#8B5CF6");
  const [backgroundAnimation, setBackgroundAnimation] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

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
          .select('business_name, business_niche, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setBusinessName(profile?.business_name || "");
        setBusinessNiche(profile?.business_niche || "");
        setAvatarUrl(profile?.avatar_url || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validation
    let hasErrors = false;
    setBusinessNameError("");
    setBusinessNicheError("");

    if (!businessName.trim()) {
      setBusinessNameError("Business name is required");
      hasErrors = true;
    }

    if (!businessNiche.trim()) {
      setBusinessNicheError("Business niche is required");
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ 
          business_name: businessName.trim(),
          business_niche: businessNiche.trim()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refetch business context to update global state
      await refetchBusiness();

      toast.success("Profile saved successfully!", {
        description: "Your business information has been updated.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save profile");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setUploadingAvatar(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validation
      if (!newPassword || !confirmPassword) {
        toast.error("Please fill in all password fields");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }

      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Clear form and close modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);

      toast.success("Password updated successfully!", {
        description: "Your new password is now active.",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || "Failed to update password");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (deleteConfirmation !== "DELETE") {
        toast.error("Please type DELETE to confirm");
        return;
      }

      setDeletingAccount(true);

      // Call the edge function to delete account
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) {
        throw error;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
      
      toast.success("Account deleted successfully");
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || "Failed to delete account");
      setDeletingAccount(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancellingSubscription(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to cancel subscription");
        return;
      }

      // Cancel subscription via Stripe
      const response = await fetch(
        `${BACKEND_URL}/functions/v1/billing-cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel');
      }

      toast.success("Subscription cancelled");
      setShowCancelModal(false);
      // Refresh the page to update subscription status
      window.location.reload();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancellingSubscription(false);
    }
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
                  <h2 className="text-xl font-bold">Business Profile</h2>
                  <p className="text-sm text-muted-foreground">Update your business identity and information</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 cursor-pointer overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG/PNG</p>
                  </div>
                </div>

                <Separator />

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (e.target.value.trim()) setBusinessNameError("");
                    }}
                    placeholder="e.g., Acme Marketing Co."
                    className={`bg-input border-border ${businessNameError ? "border-destructive" : ""}`}
                  />
                  {businessNameError && (
                    <p className="text-xs text-destructive">{businessNameError}</p>
                  )}
                </div>

                {/* Business Niche */}
                <div className="space-y-2">
                  <Label htmlFor="businessNiche">Business Niche *</Label>
                  <Input
                    id="businessNiche"
                    value={businessNiche}
                    onChange={(e) => {
                      setBusinessNiche(e.target.value);
                      if (e.target.value.trim()) setBusinessNicheError("");
                    }}
                    placeholder="e.g., Digital Marketing, E-commerce, SaaS"
                    className={`bg-input border-border ${businessNicheError ? "border-destructive" : ""}`}
                  />
                  {businessNicheError && (
                    <p className="text-xs text-destructive">{businessNicheError}</p>
                  )}
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

              {subscriptionLoading ? (
                <div className="p-6 bg-card/50 rounded-lg border border-border flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : status === "active" ? (
                <div className="p-6 bg-card/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        LynkScope Pro
                      </h3>
                      <p className="text-sm text-muted-foreground">Full access to all premium features</p>
                    </div>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
                      Active
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-foreground mb-4">
                    $20<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              ) : (
                <div className="p-6 bg-card/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {status === "trial" ? "Free Trial" : "No Active Plan"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {status === "trial" 
                          ? `${daysRemaining} days remaining · All Pro features unlocked`
                          : "Upgrade to access premium features"
                        }
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      status === "trial" 
                        ? "bg-amber-500/20 text-amber-500" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {status === "trial" ? "Trial" : status === "expired" ? "Expired" : "Cancelled"}
                    </span>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      $20<span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Cancel anytime · Billed monthly via Stripe</p>
                  </div>

                  <Button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full bg-primary hover:bg-primary/90 glow-purple"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}
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

            {/* Legal */}
            <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "500ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Legal</h2>
                  <p className="text-sm text-muted-foreground">Privacy and terms</p>
                </div>
              </div>

              <div className="space-y-4">
                <Link to="/privacy-policy" state={{ from: "settings" }}>
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:border-primary hover:bg-primary/10 transition-all"
                  >
                    Privacy Policy
                  </Button>
                </Link>

                <Link to="/terms-of-service" state={{ from: "settings" }}>
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:border-primary hover:bg-primary/10 transition-all"
                  >
                    Terms of Service
                  </Button>
                </Link>
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
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="bg-input border-border" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-input border-border" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordModal(false);
              setNewPassword("");
              setConfirmPassword("");
            }}>
              Cancel
            </Button>
            <Button
              className="gradient-purple glow-purple hover:glow-purple-strong"
              onClick={handleChangePassword}
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
            <Input 
              placeholder="DELETE" 
              className="mt-2 bg-input border-border"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
              }}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="hover:scale-105 transition-all"
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmation !== "DELETE"}
            >
              {deletingAccount ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="glass-card border-destructive">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your Pro subscription? You'll lose access to all premium features.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-foreground font-medium mb-2">What you'll lose:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Advanced analytics & insights</li>
                <li>• Geographic tracking & world map</li>
                <li>• Smart automation & A/B testing</li>
                <li>• Export data & reports</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelModal(false)}
              disabled={cancellingSubscription}
            >
              Keep Pro
            </Button>
            <Button
              variant="destructive"
              className="hover:scale-105 transition-all"
              onClick={handleCancelSubscription}
              disabled={cancellingSubscription}
            >
              {cancellingSubscription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </DashboardLayout>
  );
};

export default Settings;
