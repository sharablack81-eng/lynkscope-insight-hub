import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Redirect = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      // Read query params directly from window.location
      const params = new URLSearchParams(window.location.search);
      const encodedUrl = params.get("url");
      const linkId = params.get("linkId");
      const merchantId = params.get("mid");

      // Validate url parameter exists
      if (!encodedUrl) {
        setError("Missing destination URL");
        return;
      }

      // Decode the URL
      let decodedUrl: string;
      try {
        decodedUrl = decodeURIComponent(encodedUrl);
      } catch {
        setError("Invalid URL encoding");
        return;
      }

      // Validate URL starts with http:// or https://
      if (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://")) {
        setError("Invalid URL: must start with http:// or https://");
        return;
      }

      // Track the click (fire and forget - don't block redirect)
      supabase.functions.invoke('track-click', {
        body: { 
          destinationUrl: decodedUrl,
          linkId: linkId || undefined,
          merchantId: merchantId || undefined
        }
      }).catch(err => console.error("Failed to track click:", err));

      // Redirect immediately using window.location.replace
      window.location.replace(decodedUrl);
    };

    handleRedirect();
  }, []);

  // Show error if URL is missing or invalid
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Redirect;