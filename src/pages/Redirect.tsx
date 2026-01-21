import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase, BACKEND_ANON_KEY, BACKEND_URL } from "@/lib/backend";
const Redirect = () => {
  const { slug } = useParams();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const handleRedirect = async () => {
      // Fallback to parsing pathname if useParams doesn't capture slug (e.g. due to route config issues)
      const linkSlug = slug || window.location.pathname.split("/").pop();
      if (!linkSlug) {
        setError("Missing link slug");
        return;
      }
      try {
        // Fetch link details from Supabase
        const { data: link, error: dbError } = await supabase
          .from("links")
          .select("*")
          .eq("slug", linkSlug)
          .single();
        if (dbError || !link) {
          setError("Link not found");
          return;
        }
        // Handle potential column names for the destination URL
        const destinationUrl = link.original_url || link.url || link.destination;
        if (!destinationUrl) {
          setError("Invalid destination URL");
          return;
        }
        // Validate URL protocol
        if (!destinationUrl.startsWith("http://") && !destinationUrl.startsWith("https://")) {
          setError("Invalid URL protocol");
          return;
        }
        // Track click
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
              url: destinationUrl,
              linkId: link.id,
              merchantId: link.merchant_id || link.user_id,
              slug: linkSlug
            }),
            keepalive: true
          });
          // Check if link is expired (410 Gone)
          if (response.status === 410) {
            const data = await response.json();
            setError(data.error || "This link has expired");
            return;
          }
        } catch (e) {
          console.warn('Tracking request failed', e);
        }
        // Redirect
        window.location.replace(destinationUrl);
      } catch (err) {
        console.error("Redirect error:", err);
        setError("An error occurred");
      }
    };
    handleRedirect();
  }, [slug]);
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {error.includes("expired") ? "Link Unavailable" : "Invalid Link"}
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
</div> </div> ); };
export default Redirect;
