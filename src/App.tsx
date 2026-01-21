import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

// Lazy load components that use Supabase to avoid initialization errors
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Links = lazy(() => import("./pages/Links"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnalyticsOverview = lazy(() => import("./pages/AnalyticsOverview"));
const Settings = lazy(() => import("./pages/Settings"));
const Premium = lazy(() => import("./pages/Premium"));
const Automation = lazy(() => import("./pages/Automation"));
const Tools = lazy(() => import("./pages/Tools"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const Redirect = lazy(() => import("./pages/Redirect"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            {/* Smart links (query-based redirects) */}
            <Route path="/r/:slug" element={<Redirect />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsOverview /></ProtectedRoute>} />
            <Route path="/analytics/:linkId" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
            <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
            <Route path="/advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
            {/* Routes configured above */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
