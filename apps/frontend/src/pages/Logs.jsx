import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { Landmark, Shield } from "lucide-react";
import AuditLogs from "./AuditLogs";
import LoginLogs from "./LoginLogs";

function Logs() {
  const allTabs = [
    {
      id: "login-logs",
      label: "Login logs",
      icon: Shield,
    },
    {
      id: "audit-logs",
      label: "Audit logs",
      icon: Landmark,
    },
  ];

  const [activeTab, setActiveTab] = useState("login-logs");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "audit-logs":
        return <AuditLogs />;
      case "login-logs":
        return <LoginLogs />;
      default:
        return <AuditLogs />;
    }
  };
  return (
    <div className="space-y-12">
      <PageHeader
        breadcrumb={["Dashboard", "Settings", "Login Logs"]}
        title="Login Activity Logs"
        description="Monitor user authentication and access patterns"
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

export default Logs;
