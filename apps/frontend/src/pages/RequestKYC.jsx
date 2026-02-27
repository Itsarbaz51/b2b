import React, { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import ProfileTable from "../components/tabels/UserProfileKYC";
import BankTable from "../components/tabels/BanksTable";
import { Landmark, Shield } from "lucide-react";

function RequestKYC() {
  const allTabs = [
    {
      id: "profile-kyc",
      label: "Profile KYC",
      icon: Shield,
    },
    {
      id: "bank-kyc",
      label: "Bank KYC",
      icon: Landmark,
    },
  ];

  const [activeTab, setActiveTab] = useState("profile-kyc");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "profile-kyc":
        return <ProfileTable />;
      case "bank-kyc":
        return <BankTable />;
      default:
        return <ProfileTable />;
    }
  };
  return (
    <div className="space-y-12">
      <PageHeader
        breadcrumb={["Dashboard", "KYC Management"]}
        title="KYC Request"
        description="Review and manage customer verification documents"
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

export default RequestKYC;
