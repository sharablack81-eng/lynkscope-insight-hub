import { motion } from "framer-motion";
import worldMapImage from "@/assets/world-map-reference.png";

interface WorldMapProps {
  data: Array<{ continent: string; clicks: number }>;
}

const continentPositions: Record<string, { left: string; top: string }> = {
  'North America': { left: '18%', top: '30%' },
  'South America': { left: '28%', top: '58%' },
  'Europe': { left: '50%', top: '25%' },
  'Africa': { left: '52%', top: '48%' },
  'Asia': { left: '70%', top: '32%' },
  'Oceania': { left: '82%', top: '62%' },
  'Australia': { left: '82%', top: '62%' },
  'Antarctica': { left: '50%', top: '85%' },
};

export const WorldMap = ({ data }: WorldMapProps) => {
  const maxClicks = Math.max(...data.map(d => d.clicks), 1);

  return (
    <div className="relative w-full aspect-[2/1] bg-secondary/30 rounded-lg overflow-hidden">
      {/* World Map Background */}
      <img 
        src={worldMapImage} 
        alt="World Map" 
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      
      {/* Overlay gradient for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-background/40" />

      {/* Click markers */}
      {data
        .filter(({ continent }) => continent !== 'Unknown')
        .map(({ continent, clicks }) => {
          const position = continentPositions[continent];
          if (!position) return null;

          const scale = Math.min((clicks / maxClicks) * 1 + 0.4, 1.5);

        return (
          <motion.div
            key={continent}
            className="absolute group cursor-pointer"
            style={{
              left: position.left,
              top: position.top,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main dot */}
            <motion.div
              className="relative rounded-full bg-primary shadow-[0_0_20px_rgba(147,51,234,0.5)]"
              style={{
                width: `${scale * 20}px`,
                height: `${scale * 20}px`,
              }}
              whileHover={{ scale: 1.2 }}
            />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                <p className="text-sm font-medium text-foreground">{continent}</p>
                <p className="text-xs text-muted-foreground">{clicks} clicks</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
