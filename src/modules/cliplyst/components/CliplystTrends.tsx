import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw, Star, Loader } from "lucide-react";
import { useCliplystTrends } from "../hooks/useCliplystTrends";
import { useBusinessProfile } from "@/contexts/BusinessContext";

export function CliplystTrends() {
  const { businessNiche } = useBusinessProfile();
  const niche = businessNiche || null;
  const { trends, isLoading, isScraping, scrapeTrends, toggleSelect } =
    useCliplystTrends(niche);

  if (!niche) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Set your business niche in{" "}
            <span className="font-semibold text-primary">Settings</span> to discover
            trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trends for "{niche}"</h2>
        <Button onClick={() => scrapeTrends()} disabled={isScraping} size="sm">
          {isScraping ? (
            <Loader className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isScraping ? "Scanning…" : "Find Trends"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : trends.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No trends yet. Click "Find Trends" to scan your niche.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {trends.map((t) => (
            <Card
              key={t.id}
              className={`transition-colors cursor-pointer ${
                t.is_selected ? "border-primary" : ""
              }`}
              onClick={() => toggleSelect(t.id, !t.is_selected)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-tight">{t.title}</h3>
                  {t.is_selected && <Star className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {t.platform}
                  </Badge>
                  {t.trend_score != null && (
                    <span className="text-xs text-muted-foreground">
                      Score: {t.trend_score}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
