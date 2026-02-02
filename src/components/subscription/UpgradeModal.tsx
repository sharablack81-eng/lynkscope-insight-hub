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
import { 
  Sparkles, 
  BarChart3, 
  Zap, 
  Globe, 
  Download,
  Check,
  Loader2,
  CreditCard,
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

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to upgrade");
        setIsLoading(false);
        return;
      }

      // Call the stripe billing checkout function
      const response = await fetch(
        `${BACKEND_URL}/functions/v1/billing-checkout`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` 
          },
          body: JSON.stringify({ 
            returnUrl: window.location.origin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || "Failed to start upgrade. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Upgrade to LynkScope Pro
            </DialogTitle>
            <DialogDescription>
              Unlock powerful analytics, automation, and insights for your links
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-8">
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon: Icon, text }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </motion.div>
              ))}
            </div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-lg p-6"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pro Plan</p>
                  <p className="text-4xl font-bold">$9<span className="text-lg text-muted-foreground">/mo</span></p>
                </div>
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Billed monthly. Cancel anytime.
              </p>
            </motion.div>

            {/* Benefits List */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h3 className="font-semibold">What you get:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited link tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Advanced analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  A/B testing capabilities
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Custom branded links
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Data exports & reports
                </li>
              </ul>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3"
            >
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Continue Free Trial
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="flex-1 gradient-purple glow-purple"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </motion.div>

            <p className="text-xs text-center text-muted-foreground">
              Powered by Stripe • Secure payment processing
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
};

export default UpgradeModal;
