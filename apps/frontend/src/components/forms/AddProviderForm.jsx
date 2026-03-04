import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";
import { X } from "lucide-react";

export default function AddProviderForm({ editData, onClose, onSuccess }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: "",
    code: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || "",
        code: editData.code || "",
        isActive: editData.isActive ?? true,
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const payload = {
      type: "provider",
      ...form,
    };

    try {
      if (editData) {
        await dispatch(updateService(editData.id, payload));
      } else {
        await dispatch(createService(payload));
      }

      if (onSuccess) onSuccess();

      onClose();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">
              {editData ? "Update Provider" : "Create Provider"}
            </h2>

            <p className="text-blue-100 text-sm">Manage API providers</p>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Provider Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Provider Name
            </label>

            <input
              className="w-full border border-gray-300 px-4 py-3 rounded-xl mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Code */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Provider Code
            </label>

            <input
              className="w-full border border-gray-300 px-4 py-3 rounded-xl mt-1"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Status
            </label>

            <select
              className="w-full border border-gray-300 px-4 py-3 rounded-xl mt-1"
              value={form.isActive}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: e.target.value === "true",
                })
              }
            >
              <option value={true}>Active</option>
              <option value={false}>Inactive</option>
            </select>
          </div>

          {/* Button */}
          <div className="flex justify-end pt-3">
            <button
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              {loading
                ? "Saving..."
                : editData
                  ? "Update Provider"
                  : "Create Provider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
