import { AlertCircle } from "lucide-react";

export const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  icon: Icon,
  value,
  onChange,
  error,
  maxLength,
  inputMode,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-3 bg-gray-50 border-2 ${
          error ? "border-red-500" : "border-gray-200"
        } rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all`}
      />
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    )}
  </div>
);
