import { useEffect, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const Redirect = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = () => {
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

      // Fire-and-forget tracking using sendBeacon or fetch with keepalive
      const trackingPayload = JSON.stringify({
        url: decodedUrl,
        linkId: linkId || null,
        merchantId: merchantId || null
      });

      const trackingUrl = `${SUPABASE_URL}/functions/v1/track-click`;
      
      // Try sendBeacon first (most reliable for pre-navigation requests)
      if (navigator.sendBeacon) {
        const blob = new Blob([trackingPayload], { type: 'application/json' });
        const beaconSent = navigator.sendBeacon(trackingUrl, blob);
        if (!beaconSent) {
          // Fallback to fetch with keepalive
          fetch(trackingUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: trackingPayload,
            keepalive: true
          }).catch(() => {}); // Swallow errors - tracking is best-effort
        }
      } else {
        // Fallback for browsers without sendBeacon
        fetch(trackingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: trackingPayload,
          keepalive: true
        }).catch(() => {});
      }

      // Redirect immediately - don't wait for tracking
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