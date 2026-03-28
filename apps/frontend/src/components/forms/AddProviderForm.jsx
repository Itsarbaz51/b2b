import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";
import { X } from "lucide-react";
import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import { DropdownField } from "../ui/DropdownField";

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

  const statusOptions = [
    { id: true, label: "Active" },
    { id: false, label: "Inactive" },
  ];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <HeaderSection
          title={editData ? "Update Provider" : "Create Provider"}
          tagLine={"Manage API providers"}
          isClose={onClose}
        />

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField
            label={"Provider Name"}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <InputField
            label={"Provider Code"}
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
          />

          {/* Status */}
          <DropdownField
            label="Status"
            value={form.isActive}
            onChange={(e) =>
              setForm({
                ...form,
                isActive: e.target.value === "true",
              })
            }
            options={statusOptions.map((type) => ({
              id: type.id,
              label: type.label,
            }))}
          />

          {/* Button */}
          <div className="flex justify-end pt-3">
            <ButtonField
              name={editData ? "Update Provider" : "Create Provider"}
              type="submit"
              isDisabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
