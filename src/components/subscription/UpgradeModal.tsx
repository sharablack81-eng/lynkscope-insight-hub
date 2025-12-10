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
  Loader2
} from "lucide-react";

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
    
    // TODO: Integrate with Shopify Billing API
    // This will redirect to Shopify's approval screen
    console.log("Initiating Shopify billing flow...");
    
    // Simulate redirect delay
    setTimeout(() => {
      setIsLoading(false);
      // In production, this would redirect to Shopify
      alert("Shopify Billing integration pending. Add your Shopify credentials to enable payments.");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-purple">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Upgrade to LynkScope Pro</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Continue with uninterrupted access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
