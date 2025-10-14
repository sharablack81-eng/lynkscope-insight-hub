import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Trash2, BarChart3, ExternalLink } from "lucide-react";
import { Link } from "@/pages/Links";

interface LinkCardProps {
  link: Link;
  index: number;
  onCopy: (url: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
  onViewAnalytics: (link: Link) => void;
}

const platformColors = {
  TikTok: "from-pink-500 to-cyan-500",
  Instagram: "from-purple-500 to-pink-500",
  YouTube: "from-red-500 to-red-600",
  Other: "from-gray-500 to-gray-600"
};

const LinkCard = ({ link, index, onCopy, onEdit, onDelete, onViewAnalytics }: LinkCardProps) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(link.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="glass-card p-6 rounded-xl hover:scale-105 hover:glow-purple transition-all duration-300 group animate-scale-in relative"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Platform Badge */}
      <div className="flex items-start justify-between mb-4">
        <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${platformColors[link.platform]} text-white font-medium`}>
          {link.platform}
        </span>
        <span className="text-xs text-muted-foreground">{link.createdAt}</span>
      </div>

      {/* Link Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {link.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="w-4 h-4" />
          <span className="truncate flex-1">{link.url}</span>
          <button
            onClick={() => onCopy(link.url)}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <Copy className="w-4 h-4 hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-4 p-4 bg-card/50 rounded-lg border border-border">
        <div className="text-sm text-muted-foreground mb-1">Total Clicks</div>
        <div className="text-2xl font-bold text-primary">{link.clicks.toLocaleString()}</div>
      </div>

      {/* Actions */}
      <div
        className={`flex gap-2 transition-all duration-300 ${
          showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Navigating to analytics for link:', link.id, link);
            navigate(`/analytics/${link.id}`);
          }}
          className="flex-1 hover:border-primary hover:bg-primary/10 transition-all"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(link)}
          className="hover:border-primary hover:bg-primary/10 transition-all"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 animate-scale-in z-10">
          <div className="text-center mb-6">
            <Trash2 className="w-12 h-12 text-destructive mx-auto mb-3" />
            <h4 className="font-bold mb-2">Delete this link?</h4>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="hover:scale-105 transition-all"
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkCard;
