import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QrCode, Download, FileText, FileSpreadsheet, Link as LinkIcon } from "lucide-react";

const ToolsExports = () => {
  const [selectedLink, setSelectedLink] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [exportDateRange, setExportDateRange] = useState("30");

  const links = [
    { id: "1", name: "summer-sale", url: "https://lynk.app/summer-sale" },
    { id: "2", name: "product-launch", url: "https://lynk.app/product-launch" },
    { id: "3", name: "newsletter-signup", url: "https://lynk.app/newsletter" },
  ];

  const generateQR = () => {
    setQrGenerated(true);
    toast.success("QR Code generated successfully!");
  };

  const downloadQR = () => {
    toast.success("QR Code downloaded as PNG!");
  };

  const copyLink = () => {
    if (selectedLink) {
      const link = links.find(l => l.id === selectedLink);
      if (link) {
        navigator.clipboard.writeText(link.url);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const exportData = (format: "pdf" | "csv") => {
    toast.success(`Exporting analytics as ${format.toUpperCase()}...`);
    setTimeout(() => {
      toast.success(`Export complete! Your ${format.toUpperCase()} is ready.`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* QR Code Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QR Code Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select a link</label>
                <Select value={selectedLink} onValueChange={setSelectedLink}>
                  <SelectTrigger className="w-full bg-card/50">
                    <SelectValue placeholder="Choose a link to generate QR code" />
                  </SelectTrigger>
                  <SelectContent>
                    {links.map(link => (
                      <SelectItem key={link.id} value={link.id}>
                        {link.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateQR}
                disabled={!selectedLink}
                className="w-full gradient-purple glow-purple hover:glow-purple-strong"
              >
                Generate QR Code
              </Button>
            </div>

            {qrGenerated && selectedLink && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card p-6 rounded-xl border-2 border-primary/30 glow-purple"
              >
                <div className="flex flex-col items-center space-y-4">
                  {/* QR Code Preview */}
                  <div className="relative">
                    <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                      {/* Simulated QR Code */}
                      <div className="grid grid-cols-8 gap-1 p-4">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Glowing ring effect */}
                    <motion.div
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.05, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl border-4 border-primary"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      {links.find(l => l.id === selectedLink)?.url}
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={downloadQR} variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download PNG
                      </Button>
                      <Button onClick={copyLink} variant="outline" className="flex-1">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={exportDateRange} onValueChange={setExportDateRange}>
                <SelectTrigger className="w-full bg-card/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => exportData("pdf")}
                  variant="outline"
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 premium-card border-primary/20 hover:border-primary/40"
                >
                  <FileText className="w-12 h-12 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">PDF Report</div>
                    <div className="text-xs text-muted-foreground">Detailed analytics report</div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => exportData("csv")}
                  variant="outline"
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 premium-card border-primary/20 hover:border-primary/40"
                >
                  <FileSpreadsheet className="w-12 h-12 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">CSV File</div>
                    <div className="text-xs text-muted-foreground">Raw data export</div>
                  </div>
                </Button>
              </motion.div>
            </div>

            <div className="premium-card p-4 rounded-xl border border-primary/20">
              <h4 className="font-medium mb-2">Export includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click analytics and metrics</li>
                <li>• Geographic data</li>
                <li>• Device and browser breakdown</li>
                <li>• Referrer information</li>
                <li>• Time-based trends</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ToolsExports;
