import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

interface FeatureGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const FeatureGate = ({ children, fallback }: FeatureGateProps) => {
  const { canUsePremiumFeatures, isLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted/20 rounded-lg h-48" />
    );
  }

  if (canUsePremiumFeatures) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm p-8 text-center"
      >
        {/* Lock overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80 rounded-xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Premium Feature
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Your trial has ended. Upgrade to LynkScope Pro to unlock this feature.
            </p>
          </div>
          
          <Button 
            onClick={() => setShowUpgrade(true)}
            className="bg-primary hover:bg-primary/90 glow-purple"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </motion.div>
      
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
};

export default FeatureGate;
