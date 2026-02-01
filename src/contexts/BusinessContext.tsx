import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/backend";

/**
 * Business Profile Context
 * Provides global access to business_name and business_niche
 */

export interface BusinessProfile {
  businessName: string;
  businessNiche: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BusinessContext = createContext<BusinessProfile | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessName, setBusinessName] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // User not authenticated - this is fine for public pages
        setIsLoading(false);
        return;
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('business_name, business_niche')
        .eq('id', user.id)
        .single() as any;

      if (fetchError) {
        console.warn('Profile fetch error (may not exist yet):', fetchError);
        // Don't throw - profile might not exist yet
      }

      setBusinessName(profile?.business_name || "");
      setBusinessNiche(profile?.business_niche || "");
    } catch (err) {
      console.error('Error fetching business profile:', err);
      setError(err instanceof Error ? err.message : "Failed to load business profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        businessName,
        businessNiche,
        isLoading,
        error,
        refetch: fetchBusinessProfile,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

/**
 * Hook to access business profile from anywhere in the app
 */
export const useBusinessProfile = (): BusinessProfile => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusinessProfile must be used within a BusinessProvider");
  }
  return context;
};
