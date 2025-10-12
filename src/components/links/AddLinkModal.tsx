import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Link } from "@/pages/Links";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Partial<Link>) => void;
  editingLink: Link | null;
}

const AddLinkModal = ({ isOpen, onClose, onSave, editingLink }: AddLinkModalProps) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Link["platform"]>("Other");

  useEffect(() => {
    if (editingLink) {
      setTitle(editingLink.title);
      setUrl(editingLink.url);
      setPlatform(editingLink.platform);
    } else {
      setTitle("");
      setUrl("");
      setPlatform("Other");
    }
  }, [editingLink, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, url, platform });
    setTitle("");
    setUrl("");
    setPlatform("Other");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 glass-card p-8 rounded-2xl glow-purple animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {editingLink ? "Edit Link" : "Create New Link"}
          </h2>
          <p className="text-muted-foreground">
            {editingLink ? "Update your link details" : "Add a new tracked link to your dashboard"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Link Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g. YouTube Promo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Destination URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-input border-border focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as Link["platform"])}>
              <SelectTrigger className="bg-input border-border focus:border-primary transition-colors">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-purple glow-purple hover:glow-purple-strong hover:scale-105 transition-all"
            >
              {editingLink ? "Update Link" : "Save Link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkModal;
