import { motion } from "framer-motion";
import worldMapImage from "@/assets/world-map-reference.png";

interface WorldMapProps {
  data: Array<{ continent: string; clicks: number }>;
}

const continentPositions: Record<string, { left: string; top: string }> = {
  'North America': { left: '20%', top: '30%' },
  'South America': { left: '28%', top: '58%' },
  'Europe': { left: '50%', top: '25%' },
  'Africa': { left: '52%', top: '48%' },
  'Asia': { left: '70%', top: '32%' },
  'Oceania': { left: '80%', top: '60%' },
  'Antarctica': { left: '50%', top: '85%' },
  'Unknown': { left: '50%', top: '50%' }, // Center for testing/development
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
      {data.map(({ continent, clicks }) => {
        const position = continentPositions[continent];
        if (!position) return null;

        const scale = Math.min((clicks / maxClicks) * 2 + 0.5, 3);

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
            {/* Pulsing outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              style={{
                width: `${scale * 30}px`,
                height: `${scale * 30}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Main dot */}
            <motion.div
              className="relative rounded-full bg-primary shadow-[0_0_20px_rgba(147,51,234,0.5)]"
              style={{
                width: `${scale * 16}px`,
                height: `${scale * 16}px`,
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
