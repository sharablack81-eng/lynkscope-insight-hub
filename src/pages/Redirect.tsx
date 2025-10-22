import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Redirect = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('track-click', {
          body: { shortCode }
        });

        if (error || !data?.url) {
          console.error("Link not found:", error);
          navigate("/");
          return;
        }

        window.location.href = data.url;
      } catch (error) {
        console.error("Error redirecting:", error);
        navigate("/");
      }
    };

    handleRedirect();
  }, [shortCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Redirect;