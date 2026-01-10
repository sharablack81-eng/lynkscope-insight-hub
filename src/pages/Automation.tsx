import DashboardLayout from "@/components/layout/DashboardLayout";
import FeatureGate from "@/components/subscription/FeatureGate";
import SmartAutomation from "@/components/premium/SmartAutomation";

const Automation = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-4 h-[calc(100vh-4rem)] overflow-hidden">
        <FeatureGate>
          <div className="flex-1 min-h-0">
            <SmartAutomation />
          </div>
        </FeatureGate>
      </div>
    </DashboardLayout>
  );
};

export default Automation;
