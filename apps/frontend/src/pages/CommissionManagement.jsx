import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { Landmark, Settings } from "lucide-react";
import CommissionSetting from "./CommissionSetting";
import CommissionEarning from "./CommissionEarning";

function CommissionManagement() {
  const allTabs = [
    {
      id: "commission-setting",
      label: "Commission Setting",
      icon: Settings,
    },
    {
      id: "commission-earning",
      label: "Commission Earning",
      icon: Landmark,
    },
  ];

  const [activeTab, setActiveTab] = useState("commission-setting");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "commission-setting":
        return <CommissionSetting />;
      case "commission-earning":
        return <CommissionEarning />;
      default:
        return <CommissionSetting />;
    }
  };
  return (
    <div className="space-y-12">
      <PageHeader
        breadcrumb={["Dashboard", "Commission Management"]}
        title="Commission Management"
        description="Review and manage customer commission and earning settings"
      />
      <div className="flex space-x-1 my-8 bg-gray-100 p-1 rounded-lg w-fit">
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
      {renderActiveTab()}
    </div>
  );
}

export default CommissionManagement;
