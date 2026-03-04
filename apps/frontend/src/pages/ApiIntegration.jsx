import React, { useState } from "react";
import PageHeader from "../components/ui/PageHeader";

import { Layers, Server, Link } from "lucide-react";
import ServiceTable from "../components/tabels/ServiceTable";
import ProviderTable from "../components/tabels/ProviderTable";
import MappingTable from "../components/tabels/MappingTable";

function ApiIntegration() {

  const allTabs = [
    {
      id: "service",
      label: "Service",
      icon: Layers,
    },
    {
      id: "provider",
      label: "Provider",
      icon: Server,
    },
    {
      id: "mapping",
      label: "Mapping",
      icon: Link,
    },
  ];

  const [activeTab, setActiveTab] = useState("service");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "service":
        return <ServiceTable />;

      case "provider":
        return <ProviderTable />;

      case "mapping":
        return <MappingTable />;

      default:
        return <ServiceTable />;
    }
  };

  return (
    <div className="space-y-12">
      <PageHeader
        breadcrumb={["Dashboard", "API Integration"]}
        title="API Integration"
        description="Manage services, providers and service mappings"
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

export default ApiIntegration;