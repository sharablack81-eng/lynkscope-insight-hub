import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Globe, 
  Smartphone, 
  TestTube, 
  Clock, 
  QrCode, 
  Download,
  Zap
} from "lucide-react";

interface PremiumOverviewProps {
  onExplore: () => void;
}

const features = [
  {
    icon: Activity,
    title: "Live Tracking",
    description: "Monitor link performance in real-time with auto-refresh dashboards"
  },
  {
    icon: Globe,
    title: "Geo Analytics",
    description: "Interactive maps showing click origins by city and country"
  },
  {
    icon: Smartphone,
    title: "Device Insights",
    description: "Detailed breakdowns of devices, browsers, and platforms"
  },
  {
    icon: TestTube,
    title: "A/B Testing",
    description: "Create test variants and track performance metrics"
  },
  {
    icon: Clock,
    title: "Smart Expiration",
    description: "Auto-expire links based on clicks or time with progress tracking"
  },
  {
    icon: QrCode,
    title: "QR Tools",
    description: "Generate branded QR codes with tracking for your links"
  },
  {
    icon: Download,
    title: "Advanced Exports",
    description: "Export detailed analytics as PDF reports or CSV data"
  },
  {
    icon: Zap,
    title: "Priority Support",
    description: "Get dedicated assistance and faster response times"
  }
];

const PremiumOverview = ({ onExplore }: PremiumOverviewProps) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center max-w-3xl mx-auto mb-12"
      >
        <h2 className="text-3xl font-bold mb-4">Welcome to LynkScope Pro</h2>
        <p className="text-muted-foreground text-lg">
          You now have access to premium features designed for power users and teams
        </p>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <div className="premium-card p-6 rounded-2xl h-full group cursor-pointer">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <feature.icon className="w-7 h-7 text-primary group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-8"
      >
        <Button 
          onClick={onExplore}
          size="lg"
          className="gradient-purple glow-purple hover:glow-purple-strong transition-all hover:scale-105 text-lg px-8 py-6"
        >
          Explore Features
        </Button>
      </motion.div>
    </div>
  );
};

export default PremiumOverview;
