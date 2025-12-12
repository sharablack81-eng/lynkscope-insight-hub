import DashboardLayout from "@/components/layout/DashboardLayout";
import FeatureGate from "@/components/subscription/FeatureGate";
import AdvancedAnalyticsComponent from "@/components/premium/AdvancedAnalytics";

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <FeatureGate>
        <div className="p-6">
          <AdvancedAnalyticsComponent />
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;
