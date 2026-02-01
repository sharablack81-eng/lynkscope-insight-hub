import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: 1/14/2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            These Terms of Service ("Terms") govern your use of Lynkscope (the "App") provided by Lynkscope.
            By creating an account and using the App, you agree to these Terms.
          </p>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">1. Use of the App</h2>
            <p className="text-muted-foreground mb-4">
              You may use the App only with a valid account and in compliance with all applicable laws.
            </p>
            <p className="text-muted-foreground mb-2">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Misuse the App</li>
              <li>Attempt to access unauthorized data</li>
              <li>Reverse engineer or resell the App</li>
            </ul>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">2. Subscriptions & Billing</h2>
            <p className="text-muted-foreground mb-2">The App may offer a free tier with limited features.</p>
            <p className="text-muted-foreground mb-2">Paid subscriptions are billed monthly through Stripe.</p>
            <p className="text-muted-foreground mb-4">Pricing and plan details are displayed before purchase.</p>

            <h3 className="text-lg font-medium mb-2 text-primary">Cancellation</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>You may cancel your subscription at any time through the App settings.</li>
              <li>Cancellation takes effect at the end of your billing period.</li>
              <li>You retain access to premium features until the current billing period ends.</li>
            </ul>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">3. App Availability</h2>
            <p className="text-muted-foreground">
              We strive to keep the App available but do not guarantee uninterrupted service. Features may change or be discontinued at any time.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data & Privacy</h2>
            <p className="text-muted-foreground">
              Your use of the App is also governed by our Privacy Policy above.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may suspend or terminate access to the App if these Terms are violated.
            </p>
            <p className="text-muted-foreground mb-2">Upon uninstall:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Billing is stopped</li>
              <li>Access is revoked</li>
              <li>Data is handled per the Privacy Policy</li>
            </ul>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              The App is provided "as is". To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the App.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of Mobile, AL, without regard to conflict of law principles.
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact: <a href="mailto:lynkscopeoffical@gmail.com" className="text-primary hover:underline">lynkscopeoffical@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
