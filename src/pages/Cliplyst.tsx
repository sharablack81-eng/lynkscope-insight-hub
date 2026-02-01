import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CliplystActivationCard } from "@/components/cliplyst/CliplystActivationCard";
import { CliplystEmbed } from "@/components/cliplyst/CliplystEmbed";
import { requestCliplystSession, markCliplystActivated, isCliplystActivated } from "@/lib/cliplystEmbedService";

export default function Cliplyst() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Check authentication and activation status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        setIsAuthenticated(true);

        // Check if already activated
        const activated = isCliplystActivated();
        setIsActivated(activated);

        // If already activated, load the embed
        if (activated) {
          await loadCliplystEmbed(session.access_token);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Failed to verify authentication');
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadCliplystEmbed = async (accessToken: string) => {
    try {
      console.log('[Cliplyst] Loading embed session');
      const response = await requestCliplystSession(accessToken);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create session');
      }

      if (!response.embed_url) {
        throw new Error('No embed URL received');
      }

      setEmbedUrl(response.embed_url);
      console.log('[Cliplyst] Embed loaded successfully');
    } catch (error) {
      console.error('[Cliplyst] Error loading embed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load Cliplyst');
    }
  };

  const handleActivate = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      return;
    }

    setIsActivating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      // Load the embed
      await loadCliplystEmbed(session.access_token);

      // Mark as activated
      markCliplystActivated();
      setIsActivated(true);

      toast.success('Cliplyst activated successfully!');
      console.log('[Cliplyst] Activated');
    } catch (error) {
      console.error('[Cliplyst] Activation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to activate Cliplyst');
    } finally {
      setIsActivating(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Cliplyst...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  // Not activated - show activation card
  if (!isActivated) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <CliplystActivationCard onActivate={handleActivate} isLoading={isActivating} />
      </div>
    );
  }

  // Activated but no embed URL yet
  if (!embedUrl) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Initializing Cliplyst...</p>
        </div>
      </div>
    );
  }

  // Activated and embed URL ready
  return (
    <div className="w-full h-screen bg-gray-50">
      <CliplystEmbed embedUrl={embedUrl} />
    </div>
  );
}
