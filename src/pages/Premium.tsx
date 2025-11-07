import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PremiumOverview from "@/components/premium/PremiumOverview";
import AdvancedAnalytics from "@/components/premium/AdvancedAnalytics";
import SmartAutomation from "@/components/premium/SmartAutomation";
import ToolsExports from "@/components/premium/ToolsExports";
import { Sparkles } from "lucide-react";

const Premium = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        {/* Premium Header with Particles */}
        <div className="relative bg-gradient-dark border-b border-primary/20 overflow-hidden">
          {/* Floating particles */}
          <div className="particle-glow w-32 h-32 top-10 left-10 opacity-30" />
          <div className="particle-glow w-24 h-24 top-20 right-32 opacity-20" style={{ animationDelay: "5s" }} />
          <div className="particle-glow w-40 h-40 bottom-10 right-10 opacity-25" style={{ animationDelay: "10s" }} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 p-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-purple">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                LynkScope Pro
              </h1>
            </div>
            <p className="text-muted-foreground ml-[60px]">
              Unlock powerful insights and automation to elevate your link strategy
            </p>
          </motion.div>
        </div>

        {/* Premium Tabs */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8 bg-card/50 backdrop-blur-sm border border-primary/10">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="automation" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Automation
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                Tools
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="overview" className="mt-0">
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PremiumOverview onExplore={() => setActiveTab("analytics")} />
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdvancedAnalytics />
                </motion.div>
              </TabsContent>

              <TabsContent value="automation" className="mt-0">
                <motion.div
                  key="automation"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SmartAutomation />
                </motion.div>
              </TabsContent>

              <TabsContent value="tools" className="mt-0">
                <motion.div
                  key="tools"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ToolsExports />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Premium;
