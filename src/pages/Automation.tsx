import DashboardLayout from "@/components/layout/DashboardLayout";
import FeatureGate from "@/components/subscription/FeatureGate";
import SmartAutomation from "@/components/premium/SmartAutomation";

const Automation = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto p-6">
        <FeatureGate>
          <SmartAutomation />
        </FeatureGate>
      </div>
    </DashboardLayout>
  );
};

export default Automation;
