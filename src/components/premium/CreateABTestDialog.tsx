import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateABTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: Array<{ id: string; title: string; short_code: string; url: string }>;
  onTestCreated: () => void;
}

const CreateABTestDialog = ({ open, onOpenChange, links, onTestCreated }: CreateABTestDialogProps) => {
  const [testName, setTestName] = useState("");
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [variantAName, setVariantAName] = useState("");
  const [variantBName, setVariantBName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!testName || !selectedLinkId || !variantAName || !variantBName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedLink = links.find(l => l.id === selectedLinkId);
      if (!selectedLink) throw new Error("Link not found");

      // Create variant A
      const { data: variantA, error: errorA } = await supabase
        .from("links")
        .insert({
          user_id: user.id,
          short_code: `${selectedLink.short_code}-a`,
          platform: variantAName,
          title: `${selectedLink.title} (Variant A)`,
          url: selectedLink.url,
        })
        .select()
        .single();

      if (errorA) throw errorA;

      // Create variant B
      const { data: variantB, error: errorB } = await supabase
        .from("links")
        .insert({
          user_id: user.id,
          short_code: `${selectedLink.short_code}-b`,
          platform: variantBName,
          title: `${selectedLink.title} (Variant B)`,
          url: selectedLink.url,
        })
        .select()
        .single();

      if (errorB) throw errorB;

      // Create A/B test
      const { error: testError } = await supabase
        .from("ab_tests")
        .insert({
          user_id: user.id,
          name: testName,
          variant_a_id: variantA.id,
          variant_b_id: variantB.id,
          status: "active",
        });

      if (testError) throw testError;

      toast({
        title: "Test created",
        description: `A/B test "${testName}" has been created successfully`,
      });

      setTestName("");
      setSelectedLinkId("");
      setVariantAName("");
      setVariantBName("");
      onOpenChange(false);
      onTestCreated();
    } catch (error: any) {
      toast({
        title: "Error creating test",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New A/B Test</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              placeholder="e.g., Summer Sale Campaign"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseLink">Select Base Link</Label>
            <Select value={selectedLinkId} onValueChange={setSelectedLinkId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a link to test" />
              </SelectTrigger>
              <SelectContent>
                {links.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    {link.title} ({link.short_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variantA">Variant A Name</Label>
              <Input
                id="variantA"
                placeholder="e.g., TikTok"
                value={variantAName}
                onChange={(e) => setVariantAName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variantB">Variant B Name</Label>
              <Input
                id="variantB"
                placeholder="e.g., YouTube"
                value={variantBName}
                onChange={(e) => setVariantBName(e.target.value)}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Two new links will be created as variants of your selected link. Both will point to the same URL but can be shared on different platforms for testing.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateABTestDialog;
