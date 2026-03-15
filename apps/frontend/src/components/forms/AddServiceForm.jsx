import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";
import ButtonField from "../ui/ButtonField";
import InputField from "../ui/InputField";
import HeaderSection from "../ui/HeaderSection";
import { DropdownField } from "../ui/DropdownField";

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

  const statusOptions = [
    { id: true, label: "Active" },
    { id: false, label: "Inactive" },
  ];
  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
        <HeaderSection
          title={editData ? "Update Service" : "Create Service"}
          tagLine={
            editData
              ? "Update existing service details"
              : "Create a new service"
          }
          isClose={onClose}
        />

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
              <InputField
                label={"Service Name "}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Service name"
                error={errors.name}
              />

              <InputField
                label={"Service Code"}
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Service code"
                error={errors.code}
              />

              {/* Status */}

              <DropdownField
                label="Status Type"
                name="isActive"
                value={form.isActive}
                onChange={handleChange}
                options={statusOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
                placeholder="Select status type"
              />
            </div>

            {/* Submit */}
            <div className="pt-3 flex justify-end">
              <ButtonField
                name={editData ? "Update Service" : "Create Service"}
                type="submit"
                isDisabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
