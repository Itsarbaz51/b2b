import { useState } from "react";
import InputField from "../../ui/InputField";
import ButtonField from "../../ui/ButtonField";
import { DropdownField } from "../../ui/DropdownField";
import { CreditCard, Phone, Hash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBill, setFetchedBill } from "../../../redux/slices/bbpsSlice";
import BbpsBillPreview from "../../services/BbpsBillPreview";

const getIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("mobile")) return Phone;
  if (n.includes("amount")) return CreditCard;
  return Hash;
};

const BbpsDynamicForm = ({ billers = [], serviceProviderMappingId }) => {
  const [selectedBillerId, setSelectedBillerId] = useState("");
  const [biller, setBiller] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const { fetchedBill } = useSelector((s) => s.bbps);

  const options = billers.map((b) => ({
    id: b.billerId,
    label: b.billerName,
  }));

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedBillerId(id);

    const selected = billers.find((b) => b.billerId === id);
    setBiller(selected);

    // reset form
    setForm({});
    setErrors({});
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    biller?.customerParams?.forEach((field) => {
      if (!field.optional && !form[field.paramName]) {
        newErrors[field.paramName] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const dispatch = useDispatch();

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = {
        serviceProviderMappingId,
        billerId: selectedBillerId,
        custParam: Object.keys(form).map((key) => ({
          name: key,
          value: form[key],
        })),
      };

      await dispatch(fetchBill(payload));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm">
      {fetchedBill ? (
        <BbpsBillPreview
          bill={fetchedBill}
          onBack={() => dispatch(setFetchedBill(null))}
          onPay={() => console.log("PAY", fetchedBill.fetchId)}
        />
      ) : (
        <>
          <DropdownField
            label="Select Biller"
            name="biller"
            value={selectedBillerId}
            onChange={handleSelect}
            options={options}
            placeholder="Choose biller"
          />

          <div className="mt-4 space-y-4">
            {biller?.customerParams.map((field, i) => {
              const Icon = getIcon(field.paramName);

              return (
                <InputField
                  key={i}
                  label={field.paramName}
                  name={field.paramName}
                  type={field.dataType === "NUMERIC" ? "number" : "text"}
                  required={!field.optional}
                  icon={Icon}
                  value={form[field.paramName] || ""}
                  onChange={(e) =>
                    handleChange(field.paramName, e.target.value)
                  }
                  error={errors[field.paramName]}
                />
              );
            })}

            <ButtonField
              name="Fetch Bill"
              isOpen={handleSubmit}
              icon={CreditCard}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BbpsDynamicForm;
