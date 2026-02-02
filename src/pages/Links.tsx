import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  LinkIcon as LinkIconLucide,
} from "lucide-react";
import { toast } from "sonner";
import LinkCard from "@/components/links/LinkCard";
import AddLinkModal from "@/components/links/AddLinkModal";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/backend";

export interface Link {
  id: string;
  title: string;
  url: string;
  platform: "TikTok" | "Instagram" | "YouTube" | "Other";
  clicks: number;
  createdAt: string;
  short_code: string;
  user_id: string;
}

const Links = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // Fetch click counts from smart_link_clicks (single source of truth)
      const linksWithClicks = await Promise.all(
        (linksData || []).map(async (link) => {
          const { count } = await supabase
            .from('smart_link_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('link_id', link.id);

          return {
            id: link.id,
            title: link.title,
            url: link.url,
            platform: link.platform as "TikTok" | "Instagram" | "YouTube" | "Other",
            clicks: count || 0,
            createdAt: link.created_at.split('T')[0],
            short_code: link.short_code,
            user_id: link.user_id,
          };
        })
      );

      setLinks(linksWithClicks);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLinks(links.filter(link => link.id !== id));
      toast.success("Link deleted successfully");
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error("Failed to delete link");
    }
  };

  const handleEditLink = (link: Link) => {
    setSelectedLink(link);
    setIsAddModalOpen(true);
  };

  const handleSaveLink = async (linkData: Partial<Link>) => {
    try {
      if (selectedLink) {
        // Edit existing link
        const { error } = await supabase
          .from('links')
          .update({
            title: linkData.title,
            url: linkData.url,
            platform: linkData.platform,
          })
          .eq('id', selectedLink.id);

        if (error) throw error;
        toast.success("Link updated successfully!");
      } else {
        // Add new link - ensure session present and include user_id
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          throw new Error('You must be logged in to create a link');
        }

        // Try inserting unique short code up to a few times to avoid collisions
        let insertError = null;
        const maxAttempts = 5;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const shortCode = Math.random().toString(36).substring(2, 8);
          const { error } = await supabase
            .from('links')
            .insert({
              title: linkData.title,
              url: linkData.url,
              platform: linkData.platform,
              short_code: shortCode,
              user_id: session.user.id,
            });

          if (!error) {
            insertError = null;
            break;
          }

          insertError = error;
          // If unique constraint failed, try again. Otherwise break and surface error.
          if (error.code !== '23505') break;
        }

        if (insertError) throw insertError;
        toast.success("Link created successfully!");
      }

      await fetchLinks();
      setIsAddModalOpen(false);
      setSelectedLink(null);
    } catch (error) {
      console.error('Error saving link:', error);
      let errorMessage = "Failed to save link";
      // Supabase error objects often have .message, .details, and .code
      if (error && typeof error === 'object') {
        // @ts-expect-error dynamic shape
        const maybeMessage = error.message || error.msg || error.details;
        // @ts-expect-error
        const code = error.code || error.status;
        if (maybeMessage) errorMessage = `${maybeMessage}${code ? ` (${code})` : ''}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };


  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10 animate-fade-in">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Your Links</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and track all your links in one place
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search links..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-input border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all focus:w-72"
                  />
                </div>

                {/* New Link Button */}
                <Button
                  onClick={() => {
                    setSelectedLink(null);
                    setIsAddModalOpen(true);
                  }}
                  className="gradient-purple glow-purple hover:glow-purple-strong hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Link
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredLinks.length === 0 && searchQuery === "" ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-scale-in">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-float">
                <LinkIconLucide className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You haven't created any links yet.</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Track your audience engagement by adding your first link.
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="gradient-purple glow-purple hover:glow-purple-strong hover:scale-105 transition-all"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Link
              </Button>
            </div>
          ) : filteredLinks.length === 0 ? (
            // No Search Results
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-fade-in">
              <Search className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No links found</h2>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            // Links Grid
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLinks.map((link, index) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  index={index}
                  onCopy={handleCopyUrl}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                  onViewAnalytics={() => {}} // No longer needed, using navigate inside LinkCard
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Link Modal */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedLink(null);
        }}
        onSave={handleSaveLink}
        editingLink={selectedLink}
      />

    </DashboardLayout>
  );
};

export default Links;
