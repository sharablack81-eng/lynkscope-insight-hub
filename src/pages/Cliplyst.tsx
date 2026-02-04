import DashboardLayout from "@/components/layout/DashboardLayout";
import { CliplystContainer } from "@/components/cliplyst/CliplystContainer";

export default function Cliplyst() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <CliplystContainer />
      </div>
    </DashboardLayout>
  );
}
