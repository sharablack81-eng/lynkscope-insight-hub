import { useEffect, useState, useRef } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CliplystEmbedProps {
  embedUrl: string;
  onClose?: () => void;
}

export const CliplystEmbed = ({ embedUrl, onClose }: CliplystEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeReadyRef = useRef(false);

  useEffect(() => {
    // Reset states when embedUrl changes
    setIsLoading(true);
    setError(null);
    setIframeReady(false);
    iframeReadyRef.current = false;
    
    // Timeout: if iframe doesn't load within 15 seconds, show error
    const timeout = setTimeout(() => {
      if (!iframeReadyRef.current) {
        console.warn('[Cliplyst Embed] iframe load timeout');
        setIsLoading(false);
        setError('Cliplyst is taking too long to load. The service may be unavailable.');
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [embedUrl]);

  const handleIframeLoad = () => {
    console.log('[Cliplyst Embed] iframe loaded successfully');
    setIsLoading(false);
    setIframeReady(true);
    iframeReadyRef.current = true;
  };

  const handleIframeError = () => {
    console.error('[Cliplyst Embed] iframe failed to load');
    setIsLoading(false);
    setError('Failed to load Cliplyst. Please try again.');
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="p-6 bg-destructive/10 border border-destructive/30 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-destructive" size={24} />
            <h3 className="text-lg font-semibold text-destructive">Error Loading Cliplyst</h3>
          </div>
          <p className="text-sm text-destructive/80 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="destructive"
            className="w-full"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 rounded-lg border border-border bg-card overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center">
            <Loader className="animate-spin text-primary mb-3 mx-auto" size={32} />
            <p className="text-muted-foreground">Loading Cliplyst...</p>
          </div>
        </div>
      )}

      {/* iframe */}
      <iframe
        src={embedUrl}
        className={`flex-1 w-full border-0 transition-opacity ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        title="Cliplyst Content Engine"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="camera; microphone; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer"
      />

      {/* Close Button (if provided) */}
      {onClose && !isLoading && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-card rounded-lg shadow-md hover:bg-muted z-20 border border-border"
          title="Close Cliplyst"
        >
          <span className="text-2xl text-foreground">×</span>
        </button>
      )}
    </div>
  );
};
