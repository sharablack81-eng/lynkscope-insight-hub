import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

interface TrialBannerProps {
  onUpgrade: () => void;
}

const TrialBanner = ({ onUpgrade }: TrialBannerProps) => {
  const { status, daysRemaining, isLoading } = useSubscription();

  if (isLoading || status === "active") return null;

  const isUrgent = daysRemaining <= 3;
  const isExpired = status === "expired" || status === "cancelled";

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Your trial has ended</p>
              <p className="text-sm text-muted-foreground">
                Activate Pro to keep your analytics live
              </p>
            </div>
          </div>
          <Button 
            onClick={onUpgrade}
            className="bg-primary hover:bg-primary/90 glow-purple"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Pro ($20/month)
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 mb-6 border ${
        isUrgent 
          ? "bg-amber-500/10 border-amber-500/30" 
          : "bg-primary/10 border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUrgent ? "bg-amber-500/20" : "bg-primary/20"
          }`}>
            <Clock className={`w-5 h-5 ${isUrgent ? "text-amber-500" : "text-primary"}`} />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              14-Day Free Trial · {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
            </p>
            <p className="text-sm text-muted-foreground">
              {isUrgent 
                ? "Your trial is ending soon — upgrade to keep access" 
                : "All Pro features unlocked during your trial"
              }
            </p>
          </div>
        </div>
        {isUrgent && (
          <Button 
            onClick={onUpgrade}
            className="bg-primary hover:bg-primary/90 glow-purple"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Activate Pro
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default TrialBanner;
