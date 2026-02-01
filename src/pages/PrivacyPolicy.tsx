import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from settings (via state) or use referrer logic
  const fromSettings = location.state?.from === "settings";
  
  const handleBack = () => {
    if (fromSettings) {
      navigate("/settings");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-8 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {fromSettings ? "Back to Settings" : "Back to Home"}
        </Button>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: 1/14/2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            This Privacy Policy describes how Lynkscope ("the App", "we", "us", or
            "our") collects, uses, and discloses information when users create
            an account and use the App.
          </p>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>

            <h3 className="text-lg font-medium mb-2 text-primary">a. Account Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>Email address</li>
              <li>Display name</li>
              <li>Business name and niche (optional)</li>
              <li>Account creation date</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 text-primary">b. App Usage Data</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>Feature usage and settings</li>
              <li>Subscription status and plan</li>
              <li>Timestamps related to app activity</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 text-primary">c. Billing Information</h3>
            <p className="text-muted-foreground">
              Billing is handled by Stripe. We do not store credit card
              information directly.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide and operate the App</li>
              <li>Enable billing and subscriptions</li>
              <li>Improve performance</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Storage & Security</h2>
            <p className="text-muted-foreground">
              Data is stored securely using industry-standard practices. We do not
              sell merchant data.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Retention & Deletion</h2>
            <p className="text-muted-foreground">
              Data is retained only as long as necessary. Merchants may request
              deletion by contacting lynkscopeoffical@gmail.com.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">5. Contact</h2>
            <p className="text-muted-foreground">
              Email: <a href="mailto:lynkscopeoffical@gmail.com" className="text-primary hover:underline">lynkscopeoffical@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
