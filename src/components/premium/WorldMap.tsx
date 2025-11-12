import { motion } from "framer-motion";

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
};

export const WorldMap = ({ data }: WorldMapProps) => {
  const maxClicks = Math.max(...data.map(d => d.clicks), 1);

  return (
    <div className="relative w-full aspect-[2/1] bg-secondary/30 rounded-lg overflow-hidden">
      {/* SVG World Map */}
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified continent outlines */}
        {/* North America */}
        <path
          d="M150,150 L180,140 L210,145 L230,160 L240,180 L235,200 L220,220 L200,230 L180,235 L160,230 L145,215 L140,195 L145,175 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* South America */}
        <path
          d="M250,290 L265,280 L280,285 L285,305 L280,330 L270,350 L255,360 L245,355 L240,335 L242,315 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Europe */}
        <path
          d="M480,120 L510,115 L525,125 L520,145 L505,155 L485,150 L475,135 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Africa */}
        <path
          d="M500,220 L530,215 L545,230 L545,270 L535,295 L515,300 L495,290 L490,260 L495,235 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Asia */}
        <path
          d="M550,130 L650,120 L720,140 L730,170 L720,195 L680,205 L640,200 L600,190 L565,175 L545,155 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Oceania */}
        <path
          d="M780,290 L810,285 L825,295 L820,315 L800,320 L785,310 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Antarctica */}
        <path
          d="M300,420 L700,420 L700,450 L300,450 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

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
