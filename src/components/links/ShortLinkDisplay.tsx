import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Loader } from "lucide-react";
import { toast } from "sonner";
import { supabase, BACKEND_URL } from "@/lib/backend";

interface ShortLinkDisplayProps {
  originalUrl: string;
  linkId?: string;
  onShortLinkCreated?: (shortLink: any) => void;
}

interface ShortLink {
  id: string;
  short_code: string;
  short_url: string;
  click_count: number;
}

const ShortLinkDisplay = ({ originalUrl, linkId, onShortLinkCreated }: ShortLinkDisplayProps) => {
  const [shortLink, setShortLink] = useState<ShortLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check for existing short link on mount
  useEffect(() => {
    checkExistingShortLink();
  }, [originalUrl]);

  const checkExistingShortLink = async () => {
    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      // Look for existing short link for this URL by this user
      const { data: existing, error } = await (supabase as any)
        .from('short_links')
        .select('*')
        .eq('original_url', originalUrl)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!error && existing) {
        setShortLink({
          id: existing.id,
          short_code: existing.short_code,
          short_url: `${new URL(BACKEND_URL).origin}/functions/v1/short-link-redirect/${existing.short_code}`,
          click_count: existing.click_count || 0,
        });
      }
    } catch (err) {
      console.error('Error checking existing short link:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const createShortLink = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        toast.error("Please log in to create short links");
        setIsLoading(false);
        return;
      }

      // Try inserting unique short code up to a few times
      let created: any = null;
      const maxAttempts = 5;
      let lastError: any = null;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const shortCode = Math.random().toString(36).substring(2, 8);
        const { data, error } = await (supabase as any)
          .from('short_links')
          .insert({ 
            short_code: shortCode, 
            original_url: originalUrl, 
            user_id: session.user.id,
            link_id: linkId || null // Associate with the parent link if provided
          })
          .select()
          .single();

        if (!error && data) {
          created = { ...data, short_code: shortCode };
          break;
        }

        lastError = error || { message: 'No data returned from insert', details: data };

        // If unique constraint failed, try again. Otherwise throw.
        if (error && error.code !== '23505') {
          const msg = `${error.message || error.msg || 'Supabase error'}${error.code ? ` (${error.code})` : ''}`;
          throw new Error(msg);
        }
      }

      if (!created) {
        const msg = lastError
          ? `${lastError.message || lastError.msg || 'Failed to create short link'}${lastError.code ? ` (${lastError.code})` : ''}`
          : 'Failed to create unique short link';
        throw new Error(msg);
      }

      const shortLinkData: ShortLink = {
        id: created.id,
        short_code: created.short_code,
        short_url: `${new URL(BACKEND_URL).origin}/functions/v1/short-link-redirect/${created.short_code}`,
        click_count: created.click_count || 0,
      };

      setShortLink(shortLinkData);
      onShortLinkCreated?.(created);
      toast.success("Short link created!");
    } catch (error) {
      console.error('Error creating short link:', error);
      const message = error instanceof Error ? error.message : 'Failed to create short link';
      toast.error(message.substring(0, 200));
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

  const handleRegenerate = async () => {
    // Delete existing short link first
    if (shortLink?.id) {
      try {
        await (supabase as any)
          .from('short_links')
          .delete()
          .eq('id', shortLink.id);
      } catch (err) {
        console.error('Error deleting old short link:', err);
      }
    }
    setShortLink(null);
    createShortLink();
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
