import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Reset states when embedUrl changes
    setIsLoading(true);
    setError(null);
    setIframeReady(false);
  }, [embedUrl]);

  const handleIframeLoad = () => {
    console.log('[Cliplyst Embed] iframe loaded successfully');
    setIsLoading(false);
    setIframeReady(true);
  };

  const handleIframeError = () => {
    console.error('[Cliplyst Embed] iframe failed to load');
    setIsLoading(false);
    setError('Failed to load Cliplyst. Please try again.');
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Card className="p-6 bg-red-50 border border-red-200 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500" size={24} />
            <h3 className="text-lg font-semibold text-red-900">Error Loading Cliplyst</h3>
          </div>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <Loader className="animate-spin text-orange-500 mb-3 mx-auto" size={32} />
            <p className="text-gray-600">Loading Cliplyst...</p>
          </div>
        </div>
      )}

      {/* iframe */}
      <iframe
        src={embedUrl}
        className={`w-full h-full border-0 rounded-lg transition-opacity ${
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
          className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 z-20"
          title="Close Cliplyst"
        >
          <span className="text-2xl">×</span>
        </button>
      )}
    </div>
  );
};
