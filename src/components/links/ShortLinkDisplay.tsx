import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Loader } from "lucide-react";
import { toast } from "sonner";
import { BACKEND_URL, BACKEND_ANON_KEY } from "@/lib/backend";

interface ShortLinkDisplayProps {
  originalUrl: string;
  linkId?: string;
  onShortLinkCreated?: (shortLink: any) => void;
}

interface ShortLink {
  short_code: string;
  short_url: string;
  click_count: number;
}

const ShortLinkDisplay = ({ originalUrl, linkId, onShortLinkCreated }: ShortLinkDisplayProps) => {
  const [shortLink, setShortLink] = useState<ShortLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const createShortLink = async () => {
    setIsLoading(true);
    try {
      // Get auth token from session storage or localStorage
      const session = JSON.parse(sessionStorage.getItem('sb-session') || '{}');
      const token = session?.access_token;

      if (!token) {
        toast.error("Authentication required");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/functions/v1/short-link-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': BACKEND_ANON_KEY,
        },
        body: JSON.stringify({
          originalUrl: originalUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create short link');
      }

      const data = await response.json();
      const shortLinkData: ShortLink = {
        short_code: data.short_code,
        short_url: data.short_url,
        click_count: data.click_count,
      };

      setShortLink(shortLinkData);
      onShortLinkCreated?.(data);
      toast.success("Short link created!");
    } catch (error) {
      console.error('Error creating short link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create short link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyShortLink = () => {
    if (shortLink?.short_url) {
      navigator.clipboard.writeText(shortLink.short_url);
      toast.success("Short link copied to clipboard!");
    }
  };

  const handleRegenerate = () => {
    setShortLink(null);
    createShortLink();
  };

  return (
    <div className="space-y-3">
      {!shortLink ? (
        <Button
          onClick={createShortLink}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="w-full text-xs"
        >
          {isLoading ? (
            <>
              <Loader className="w-3 h-3 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Short Link"
          )}
        </Button>
      ) : (
        <>
          <div
            className="bg-card/50 rounded-lg p-3 border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Short Link:</p>
                <p className="text-sm font-mono font-medium truncate text-primary">
                  {shortLink.short_code}
                </p>
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {shortLink.click_count} clicks
              </span>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="bg-card/30 rounded p-2 break-all text-xs text-muted-foreground">
                {shortLink.short_url}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyShortLink}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy URL
                </Button>
                <Button
                  onClick={handleRegenerate}
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShortLinkDisplay;
