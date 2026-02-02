import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

const DISMISS_KEY = 'trial_expired_dismissed_v1';

interface TrialExpiredScreenProps {
  onUninstall?: () => void;
}

const TrialExpiredScreen = ({ onUninstall }: TrialExpiredScreenProps) => {
  const { status, isLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const v = sessionStorage.getItem(DISMISS_KEY);
    setDismissed(v === '1');
  }, []);

  // Only show if trial has expired
  if (isLoading || status === "trial" || status === "active") {
    return null;
  }

  // If user hasn't dismissed yet, show the dismissible centered screen
  if (!dismissed) {
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
            >
              <Clock className="w-10 h-10 text-primary" />
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground mb-2">Your trial has ended</h1>
            <p className="text-muted-foreground mb-8">
              Upgrade to Pro to keep your analytics live and continue tracking your links.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="text-2xl font-bold text-foreground">
                $9<span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">Billed monthly via Stripe • Cancel anytime</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Dismiss trial banner but keep enforcement active
                  sessionStorage.setItem(DISMISS_KEY, '1');
                  setDismissed(true);
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => setShowUpgrade(true)}
                className="flex-1 bg-primary hover:bg-primary/90 glow-purple h-12"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
      </>
    );
  }

  // If dismissed, render a persistent blocking overlay over the main content area (sidebar remains usable)
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-y-0 right-0 left-64 z-40 bg-black/80 flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full mx-4 bg-card border border-primary/20 rounded-2xl p-6 text-center shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Your trial has ended</h2>
          <p className="text-sm text-muted-foreground mb-4">Upgrade to Pro to restore full access. Settings remain available.</p>
          <Button onClick={() => setShowUpgrade(true)} className="w-full bg-primary">Upgrade Now</Button>
        </motion.div>
      </motion.div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
};

export default TrialExpiredScreen;
