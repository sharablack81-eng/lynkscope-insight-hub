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
  'Unknown': { left: '50%', top: '50%' }, // Center for testing/development
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
        {/* Grid lines for reference */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />
        <line x1="500" y1="0" x2="500" y2="500" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />
        
        {/* North America */}
        <path
          d="M150,180 L160,160 L180,150 L200,145 L220,150 L240,160 L250,180 L255,200 L250,220 L240,240 L220,250 L200,255 L180,250 L160,240 L150,220 L145,200 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* South America */}
        <path
          d="M250,280 L260,270 L275,275 L285,290 L288,310 L285,330 L275,345 L260,355 L245,350 L235,335 L233,315 L238,295 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* Europe */}
        <path
          d="M480,140 L495,135 L515,138 L530,145 L535,160 L530,175 L515,185 L495,180 L480,170 L475,155 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* Africa */}
        <path
          d="M495,200 L510,195 L530,200 L545,220 L548,250 L545,280 L535,300 L515,310 L495,305 L485,285 L482,255 L485,225 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* Asia */}
        <path
          d="M550,140 L590,130 L640,135 L690,145 L730,160 L750,180 L745,205 L720,215 L680,220 L640,215 L600,205 L565,190 L545,170 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* Oceania/Australia */}
        <path
          d="M780,280 L800,275 L820,280 L835,290 L838,305 L830,320 L810,325 L790,320 L775,305 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* Antarctica */}
        <path
          d="M200,430 L800,430 L800,460 L200,460 Z"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          opacity="0.5"
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
