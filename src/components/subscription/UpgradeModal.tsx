import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  BarChart3, 
  Zap, 
  Globe, 
  Download,
  Check,
  Loader2,
  Store,
  ExternalLink
} from "lucide-react";
import { supabase, BACKEND_URL } from "@/lib/backend";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  { icon: BarChart3, text: "Advanced analytics & insights" },
  { icon: Globe, text: "Geographic tracking & world map" },
  { icon: Zap, text: "Smart automation & A/B testing" },
  { icon: Download, text: "Export data & reports" },
];

const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [needsShopConnection, setNeedsShopConnection] = useState(false);
  const [shopDomain, setShopDomain] = useState("");
  const [connectingShop, setConnectingShop] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to upgrade");
        setIsLoading(false);
        return;
      }

      // Call the shopify-billing edge function to create a charge
      const response = await fetch(
        `${BACKEND_URL}/functions/v1/shopify-billing?action=create-charge`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` 
          },
          body: JSON.stringify({ returnUrl: `${window.location.origin}/dashboard` }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.needsConnection) {
          // Shop not connected, show connection form
          setNeedsShopConnection(true);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Billing failed');
      }

      if (data?.confirmationUrl) {
        // Redirect to Shopify to confirm the charge
        window.location.href = data.confirmationUrl;
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleConnectShop = async () => {
    if (!shopDomain.trim()) {
      toast.error("Please enter your Shopify store domain");
      return;
    }

    setConnectingShop(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        setConnectingShop(false);
        return;
      }

      // Call the shopify-oauth function to get install URL
      const response = await fetch(
        `${BACKEND_URL}/functions/v1/shopify-oauth?action=install`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` 
          },
          body: JSON.stringify({ shopDomain: shopDomain.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      if (data?.installUrl) {
        // Redirect to Shopify to install app
        window.location.href = data.installUrl;
      }
    } catch (error: any) {
      console.error('Connect shop error:', error);
      toast.error(error.message || "Failed to connect shop");
      setConnectingShop(false);
    }
  };

  const handleBack = () => {
    setNeedsShopConnection(false);
    setShopDomain("");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) {
        setNeedsShopConnection(false);
        setShopDomain("");
      }
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-purple">
              {needsShopConnection ? (
                <Store className="w-6 h-6 text-primary" />
              ) : (
                <Sparkles className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {needsShopConnection ? "Connect Your Shopify Store" : "Upgrade to LynkScope Pro"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {needsShopConnection 
                  ? "Connect your store to enable billing" 
                  : "Continue with uninterrupted access"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {needsShopConnection ? (
            <motion.div
              key="connect"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopDomain">Shopify Store Domain</Label>
                  <Input
                    id="shopDomain"
                    placeholder="your-store.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your .myshopify.com domain (not your custom domain)
                  </p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                  <p className="text-amber-500 font-medium mb-1">One-time Setup</p>
                  <p className="text-muted-foreground">
                    You'll be redirected to Shopify to authorize LynkScope. This allows us to manage your subscription through Shopify's billing system.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleConnectShop}
                  disabled={connectingShop || !shopDomain.trim()}
                  className="w-full bg-primary hover:bg-primary/90 glow-purple h-12"
                >
                  {connectingShop ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Connect to Shopify
                    </span>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Back
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upgrade"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 py-4"
            >
              {/* Features list */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Pricing */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-foreground mb-1">
                  $20<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cancel anytime · Managed by Shopify
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 glow-purple h-12 text-base"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Redirecting to Shopify...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cta"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Activate Pro
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Maybe later
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
