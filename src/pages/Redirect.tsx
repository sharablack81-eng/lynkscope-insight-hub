import { useEffect, useState } from "react";
import { BACKEND_ANON_KEY, BACKEND_URL } from "@/lib/backend";

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

      // Fire-and-forget tracking using fetch with keepalive
      const trackingUrl = `${BACKEND_URL}/functions/v1/track-click`;
      
      try {
        const response = await fetch(trackingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': BACKEND_ANON_KEY,
            'Authorization': `Bearer ${BACKEND_ANON_KEY}`
          },
          body: JSON.stringify({
            url: decodedUrl,
            linkId: linkId || null,
            merchantId: merchantId || null
          }),
          keepalive: true
        });

        // Check if link is expired (410 Gone)
        if (response.status === 410) {
          const data = await response.json();
          setError(data.error || "This link has expired");
          return;
        }
      } catch {
        // Tracking failed, but we still redirect
        console.warn('Tracking request failed, proceeding with redirect');
      }

      // Redirect
      window.location.href = decodedUrl;
    };

    handleRedirect();
  }, []);

  // Show error if URL is missing, invalid, or link expired
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {error.includes("expired") || error.includes("inactive") || error.includes("maximum") 
              ? "Link Unavailable" 
              : "Invalid Link"}
          </h1>
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
