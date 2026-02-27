import React, { useState } from "react";

const settingsData = [
  { key: "logo", label: "Logo", type: "text" },
  { key: "favicon", label: "Favicon", type: "url" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "facebook", label: "Facebook", type: "url" },
  { key: "twitter", label: "Twitter", type: "url" },
  { key: "instagram", label: "Instagram", type: "url" },
  { key: "linkedin", label: "LinkedIn", type: "url" },
  { key: "whatsapp", label: "WhatsApp", type: "text" },
];

const SettingsForm = () => {
  const [formData, setFormData] = useState(
    Object.fromEntries(settingsData.map(({ key }) => [key, ""]))
  );

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (key) => {
    alert(`Saved ${key}: ${formData[key]}`);
  };

  return (
    <div className=" bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-6">Manage Settings</h1>
        <div className="grid gap-6">
          {settingsData.map(({ key, label, type }) => (
            <div
              key={key}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <label className="font-medium w-full md:w-1/4">{label}</label>
              {type === "textarea" ? (
                <textarea
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full md:w-3/4 p-2 border border-gray-300 rounded"
                />
              ) : (
                <input
                  type={type}
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full md:w-3/4 p-2 border border-gray-300 rounded"
                />
              )}
              <button
                onClick={() => handleSave(key)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsForm;
