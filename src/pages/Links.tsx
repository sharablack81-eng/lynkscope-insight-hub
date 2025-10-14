import { useState } from "react";
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

export interface Link {
  id: string;
  title: string;
  url: string;
  platform: "TikTok" | "Instagram" | "YouTube" | "Other";
  clicks: number;
  createdAt: string;
}

const Links = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  
  // Placeholder data
  const [links, setLinks] = useState<Link[]>([
    {
      id: "1",
      title: "YouTube Promo",
      url: "https://lynk.to/youtube-promo",
      platform: "YouTube",
      clicks: 1247,
      createdAt: "2025-01-15"
    },
    {
      id: "2",
      title: "Instagram Bio Link",
      url: "https://lynk.to/insta-bio",
      platform: "Instagram",
      clicks: 3891,
      createdAt: "2025-01-10"
    },
    {
      id: "3",
      title: "TikTok Campaign",
      url: "https://lynk.to/tiktok-jan",
      platform: "TikTok",
      clicks: 2654,
      createdAt: "2025-01-20"
    }
  ]);

  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
    toast.success("Link deleted successfully");
  };

  const handleEditLink = (link: Link) => {
    setSelectedLink(link);
    setIsAddModalOpen(true);
  };

  const handleSaveLink = (linkData: Partial<Link>) => {
    if (selectedLink) {
      // Edit existing link
      setLinks(links.map(link => 
        link.id === selectedLink.id 
          ? { ...link, ...linkData }
          : link
      ));
      toast.success("Link updated successfully!");
    } else {
      // Add new link
      const newLink: Link = {
        id: Date.now().toString(),
        title: linkData.title || "",
        url: linkData.url || "",
        platform: linkData.platform || "Other",
        clicks: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setLinks([newLink, ...links]);
      toast.success("Link created successfully!");
    }
    setIsAddModalOpen(false);
    setSelectedLink(null);
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
          {filteredLinks.length === 0 && searchQuery === "" ? (
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
