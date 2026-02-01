import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CliplystActivationCardProps {
  onActivate: () => void;
  isLoading?: boolean;
}

export const CliplystActivationCard = ({ onActivate, isLoading = false }: CliplystActivationCardProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500 rounded-lg">
            <Play size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-900">Activate Cliplyst Content Engine</h2>
            <p className="text-sm text-orange-700 mt-1">Bring content automation to Lynkscope</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">
            Enable automated content generation based on your marketing analytics. Cliplyst will use your platform performance data to create targeted content strategies.
          </p>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span>AI-powered content generation</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span>Automatic platform scheduling</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span>Unified dashboard experience</span>
            </li>
          </ul>
        </div>

        {/* Activation Button */}
        <Button
          onClick={onActivate}
          disabled={isLoading}
          className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          {isLoading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Activate Cliplyst
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-gray-600 text-center">
          Cliplyst will run securely inside Lynkscope. No separate login required.
        </p>
      </div>
    </Card>
  );
};
