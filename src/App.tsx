import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Links from "./pages/Links";
import Analytics from "./pages/Analytics";
import AnalyticsOverview from "./pages/AnalyticsOverview";
import Settings from "./pages/Settings";
import Premium from "./pages/Premium";
import Automation from "./pages/Automation";
import Tools from "./pages/Tools";
import NotFound from "./pages/NotFound";
import Redirect from "./pages/Redirect";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const accentColors = [
  { name: "Purple", value: "#8B5CF6", hsl: "258 90% 66%" },
  { name: "Blue", value: "#3B82F6", hsl: "217 91% 60%" },
  { name: "Cyan", value: "#06B6D4", hsl: "188 94% 43%" },
  { name: "Pink", value: "#EC4899", hsl: "330 81% 60%" },
];

const App = () => {
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('darkMode');
    const isDark = savedTheme === null ? true : savedTheme === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply saved animation preference
    const savedAnimation = localStorage.getItem('backgroundAnimation');
    const isEnabled = savedAnimation === null ? true : savedAnimation === 'true';
    if (isEnabled) {
      document.documentElement.classList.remove('no-animations');
    } else {
      document.documentElement.classList.add('no-animations');
    }

    // Apply saved accent color
    const savedColor = localStorage.getItem('accentColor');
    if (savedColor) {
      const colorData = accentColors.find(c => c.value === savedColor);
      if (colorData) {
        const root = document.documentElement;
        root.style.setProperty('--primary', colorData.hsl);
        root.style.setProperty('--accent', colorData.hsl);
        root.style.setProperty('--ring', colorData.hsl);
        root.style.setProperty('--sidebar-primary', colorData.hsl);
        root.style.setProperty('--sidebar-ring', colorData.hsl);
      }
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/l/:shortCode" element={<Redirect />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsOverview /></ProtectedRoute>} />
          <Route path="/analytics/:linkId" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
          <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
          <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
