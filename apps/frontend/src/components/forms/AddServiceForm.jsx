import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";

export default function AddServiceForm({ editData, onClose, onSuccess }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    code: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      setForm(editData);
    }
  }, [editData]);

  const handleChange = (e) => {
    let value =
      e.target.name === "isActive" ? e.target.value === "true" : e.target.value;

    if (e.target.name === "code") {
      value = value.toUpperCase();
    }

    setForm({ ...form, [e.target.name]: value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }

    if (message.text) setMessage({ type: "", text: "" });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name) newErrors.name = "Service name is required";
    if (!form.code) newErrors.code = "Service code is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setMessage({
        type: "error",
        text: "Please fill required fields",
      });
      return;
    }

    setLoading(true);

    const payload = {
      type: "service",
      ...form,
    };

    try {
      if (editData) {
        await dispatch(updateService(editData.id, payload));
      } else {
        await dispatch(createService(payload));
      }

      setMessage({
        type: "success",
        text: editData
          ? "Service updated successfully!"
          : "Service created successfully!",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setMessage({
        type: "error",
        text: "Something went wrong",
      });
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData ? "Update Service" : "Create Service"}
            </h2>

            <p className="text-blue-100 text-sm mt-1">
              {editData
                ? "Update existing service details"
                : "Create a new service"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-black hover:bg-opacity-20 rounded-full p-2"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.name
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Service name"
                />

                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ">
                  Service Code *
                </label>

                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none uppercase ${
                    errors.code
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Service code"
                />

                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>

                <select
                  name="isActive"
                  value={form.isActive}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-400"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editData
                    ? "Update Service"
                    : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
