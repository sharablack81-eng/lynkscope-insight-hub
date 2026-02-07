import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, TrendingUp, MessageSquare, Calendar } from "lucide-react";
import { CliplystUpload } from "../components/CliplystUpload";
import { CliplystTrends } from "../components/CliplystTrends";
import { CliplystCaptions } from "../components/CliplystCaptions";
import { CliplystScheduler } from "../components/CliplystScheduler";

export default function CliplystDashboard() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cliplyst Content Studio</h1>
        <p className="text-muted-foreground">
          Upload videos, discover trends, generate captions, and schedule posts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="captions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Captions</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <CliplystUpload />
        </TabsContent>
        <TabsContent value="trends">
          <CliplystTrends />
        </TabsContent>
        <TabsContent value="captions">
          <CliplystCaptions />
        </TabsContent>
        <TabsContent value="schedule">
          <CliplystScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
}
