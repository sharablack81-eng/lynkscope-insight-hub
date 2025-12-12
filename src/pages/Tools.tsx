import DashboardLayout from "@/components/layout/DashboardLayout";
import FeatureGate from "@/components/subscription/FeatureGate";
import ToolsExports from "@/components/premium/ToolsExports";

const Tools = () => {
  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto p-6">
        <FeatureGate>
          <ToolsExports />
        </FeatureGate>
      </div>
    </DashboardLayout>
  );
};

export default Tools;
