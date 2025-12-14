import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

interface TrialExpiredScreenProps {
  onUninstall?: () => void;
}

const TrialExpiredScreen = ({ onUninstall }: TrialExpiredScreenProps) => {
  const { status, isLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Only show if trial has expired
  if (isLoading || status === "trial" || status === "active") {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md w-full mx-4 bg-card border border-primary/20 rounded-2xl p-8 text-center shadow-2xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your trial has ended
          </h1>
          <p className="text-muted-foreground mb-8">
            Activate Pro to keep your analytics live and continue tracking your links.
          </p>

          {/* Pricing highlight */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="text-2xl font-bold text-foreground">
              $20<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cancel anytime · Managed by Shopify
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={() => setShowUpgrade(true)}
              className="w-full bg-primary hover:bg-primary/90 glow-purple h-12 text-base"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Upgrade to Pro for Full Access
            </Button>
            
            {onUninstall && (
              <Button 
                variant="ghost" 
                onClick={onUninstall}
                className="w-full text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Uninstall App
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
};

export default TrialExpiredScreen;
