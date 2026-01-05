import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QrCode, Download, FileText, FileSpreadsheet, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subDays } from "date-fns";
import QRCodeLib from "qrcode";

const ToolsExports = () => {
  const [selectedLink, setSelectedLink] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [exportDateRange, setExportDateRange] = useState("30");

  // Fetch real links from database
  const { data: links = [] } = useQuery({
    queryKey: ["links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const generateQR = async () => {
    if (!selectedLink) return;
    
    try {
      const link = links.find(l => l.id === selectedLink);
      if (!link) return;

      const shortUrl = `${window.location.origin}/l/${link.short_code}`;
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCodeLib.toDataURL(shortUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrDataUrl);
      setQrGenerated(true);
      toast.success("QR Code generated successfully!");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const downloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    const link = links.find(l => l.id === selectedLink);
    if (!link) return;

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = qrCodeDataUrl;
    downloadLink.download = `qr-${link.short_code}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast.success("QR Code downloaded as PNG!");
  };

  const copyLink = () => {
    if (selectedLink) {
      const link = links.find(l => l.id === selectedLink);
      if (link) {
        const shortUrl = `${window.location.origin}/l/${link.short_code}`;
        navigator.clipboard.writeText(shortUrl);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const exportData = async (exportFormat: "pdf" | "csv") => {
    try {
      toast.loading(`Preparing ${exportFormat.toUpperCase()} export...`);
      
      // Calculate date range
      const daysBack = exportDateRange === "all" ? 3650 : parseInt(exportDateRange);
      const startDate = subDays(new Date(), daysBack);

      // Fetch all analytics data
      const { data: linksData, error: linksError } = await supabase
        .from("links")
        .select("*");

      if (linksError) throw linksError;

      const { data: clicksData, error: clicksError } = await supabase
        .from("link_clicks")
        .select("*")
        .gte("clicked_at", startDate.toISOString());

      if (clicksError) throw clicksError;

      // Process analytics data
      const totalClicks = clicksData?.length || 0;
      
      // Geographic breakdown
      const geoData = clicksData?.reduce((acc: any, click: any) => {
        const location = click.continent || "Unknown";
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {});

      // Device breakdown
      const deviceData = clicksData?.reduce((acc: any, click: any) => {
        const device = click.device_type || "Unknown";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {});

      // Browser breakdown
      const browserData = clicksData?.reduce((acc: any, click: any) => {
        const browser = click.browser || "Unknown";
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {});

      // Referrer breakdown
      const referrerData = clicksData?.reduce((acc: any, click: any) => {
        const referrer = click.referrer || "Direct";
        acc[referrer] = (acc[referrer] || 0) + 1;
        return acc;
      }, {});

      // Time-based trends (daily)
      const dailyClicks = clicksData?.reduce((acc: any, click: any) => {
        const date = format(new Date(click.clicked_at), "yyyy-MM-dd");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      if (exportFormat === "pdf") {
        exportPDF({
          totalClicks,
          linksData: linksData || [],
          geoData,
          deviceData,
          browserData,
          referrerData,
          dailyClicks,
          dateRange: exportDateRange,
        });
      } else {
        exportCSV({
          clicksData: clicksData || [],
          linksData: linksData || [],
        });
      }

      toast.dismiss();
      toast.success(`${exportFormat.toUpperCase()} exported successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.dismiss();
      toast.error("Failed to export analytics");
    }
  };

  const exportPDF = (data: any) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("LynkScope Analytics Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 28);
    doc.text(`Date Range: Last ${data.dateRange === "all" ? "all time" : `${data.dateRange} days`}`, 14, 34);

    let yPos = 45;

    // Overview
    doc.setFontSize(14);
    doc.text("Overview", 14, yPos);
    yPos += 7;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        ["Total Clicks", data.totalClicks.toString()],
        ["Total Links", data.linksData.length.toString()],
      ],
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Geographic Breakdown
    doc.setFontSize(14);
    doc.text("Geographic Breakdown", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Continent", "Clicks"]],
      body: Object.entries(data.geoData || {}).map(([key, value]) => [key, value]),
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Device Breakdown
    doc.setFontSize(14);
    doc.text("Device Breakdown", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Device Type", "Clicks"]],
      body: Object.entries(data.deviceData || {}).map(([key, value]) => [key, value]),
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Browser Breakdown
    doc.setFontSize(14);
    doc.text("Browser Breakdown", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Browser", "Clicks"]],
      body: Object.entries(data.browserData || {}).map(([key, value]) => [key, value]),
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Referrer Information
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Referrer Information", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Referrer", "Clicks"]],
      body: Object.entries(data.referrerData || {}).map(([key, value]) => [key, value]),
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Time-based Trends
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text("Daily Click Trends", 14, yPos);
    yPos += 7;

    const sortedDailyClicks = Object.entries(data.dailyClicks || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30); // Last 30 days

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Clicks"]],
      body: sortedDailyClicks.map(([key, value]) => [key, value]),
    });

    // Save PDF
    doc.save(`lynkscope-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const exportCSV = (data: any) => {
    const rows = [
      ["LynkScope Analytics Export"],
      [`Generated: ${format(new Date(), "PPpp")}`],
      [],
      ["Click ID", "Link Title", "Short Code", "Clicked At", "Country", "Continent", "Device Type", "Browser", "Referrer", "IP Address"],
    ];

    // Add click data rows
    data.clicksData.forEach((click: any) => {
      const link = data.linksData.find((l: any) => l.id === click.link_id);
      rows.push([
        click.id,
        link?.title || "Unknown",
        link?.short_code || "Unknown",
        format(new Date(click.clicked_at), "yyyy-MM-dd HH:mm:ss"),
        click.country || "Unknown",
        click.continent || "Unknown",
        click.device_type || "Unknown",
        click.browser || "Unknown",
        click.referrer || "Direct",
        click.ip_address || "Unknown",
      ]);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lynkscope-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                        {link.title} ({link.short_code})
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
                    <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center overflow-hidden p-4">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                      />
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
                      {window.location.origin}/l/{links.find(l => l.id === selectedLink)?.short_code}
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
