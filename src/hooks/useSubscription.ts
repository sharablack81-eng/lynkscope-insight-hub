import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

        // Default to trial - database table will be set up later
        setState({
          status: "trial",
          daysRemaining: 14,
          isLoading: false,
          canUsePremiumFeatures: true,
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
