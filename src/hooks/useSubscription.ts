import { useState, useEffect } from "react";
import { supabase } from "@/lib/backend";

export type SubscriptionStatus = "trial" | "active" | "cancelled" | "expired";

interface SubscriptionState {
  status: SubscriptionStatus;
  daysRemaining: number;
  isLoading: boolean;
  canUsePremiumFeatures: boolean;
  trialEndDate: Date | null;
}

export const useSubscription = (): SubscriptionState => {
  const [state, setState] = useState<SubscriptionState>({
    status: "trial",
    daysRemaining: 14,
    isLoading: true,
    canUsePremiumFeatures: true,
    trialEndDate: null,
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const { data: subscription, error } = await supabase
          .from("subscriptions")
          .select("status, trial_end_date")
          .eq("user_id", user.id)
          .single();

        if (error || !subscription) {
          // Default to trial if no subscription record found
          setState({
            status: "trial",
            daysRemaining: 14,
            isLoading: false,
            canUsePremiumFeatures: true,
            trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          });
          return;
        }

        const trialEnd = new Date(subscription.trial_end_date);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Check if trial has expired
        let status = subscription.status as SubscriptionStatus;
        if (status === "trial" && daysRemaining <= 0) {
          status = "expired";
        }

        const canUsePremiumFeatures = status === "trial" || status === "active";

        setState({
          status,
          daysRemaining,
          isLoading: false,
          canUsePremiumFeatures,
          trialEndDate: trialEnd,
        });
      } catch (err) {
        console.error("Subscription fetch error:", err);
        setState(prev => ({ ...prev, isLoading: false, canUsePremiumFeatures: true }));
      }
    };

    fetchSubscription();
  }, []);

  return state;
};
