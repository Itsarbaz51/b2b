import { useState, useEffect } from "react";
import InputField from "../../ui/InputField";
import ButtonField from "../../ui/ButtonField";
import { DropdownField } from "../../ui/DropdownField";
import { CreditCard, Phone, Hash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBill,
  payBill,
  setFetchedBill,
} from "../../../redux/slices/bbpsSlice";
import BbpsBillPreview from "../../services/BbpsBillPreview";
import { v4 as uuidv4 } from "uuid";

const getIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("mobile")) return Phone;
  if (n.includes("amount")) return CreditCard;
  return Hash;
};

const BbpsDynamicForm = ({ billers = [], serviceProviderMappingId }) => {
  const dispatch = useDispatch();

  const [selectedBillerId, setSelectedBillerId] = useState("");
  const [biller, setBiller] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [idempotencyKey] = useState(uuidv4());

  const { fetchedBill, isLoading } = useSelector((s) => s.bbps);

  // 🔥 AUTO SELECT IF SINGLE BILLER
  useEffect(() => {
    if (billers.length === 1) {
      const b = billers[0];
      setSelectedBillerId(b.billerId);
      setBiller(b);
    }
  }, [billers]);

  const options = billers.map((b) => ({
    id: b.billerId,
    label: b.billerName,
  }));

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedBillerId(id);

    const selected = billers.find((b) => b.billerId === id);
    setBiller(selected);

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
        newErrors[field.paramName] = "Required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await dispatch(
      fetchBill({
        serviceProviderMappingId,
        billerId: selectedBillerId,
        custParam: Object.keys(form).map((key) => ({
          name: key,
          value: form[key],
        })),
      }),
    );
  };

  const handlePay = async () => {
    await dispatch(
      payBill({
        serviceProviderMappingId,
        fetchId: fetchedBill.fetchId,
        amount: Number(fetchedBill.amount),
        idempotencyKey,
      }),
    );
  };

  // 🔥 EMPTY STATE
  if (!billers.length && !isLoading) {
    return (
      <div className="text-center py-10 text-gray-500">
        No billers available
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm">
      {fetchedBill ? (
        <BbpsBillPreview
          bill={fetchedBill}
          onBack={() => dispatch(setFetchedBill(null))}
          onPay={handlePay}
        />
      ) : (
        <>
          {/* 🔥 SHOW DROPDOWN ONLY IF MULTIPLE */}
          {billers.length > 1 && (
            <DropdownField
              label="Select Biller"
              value={selectedBillerId}
              onChange={handleSelect}
              options={options}
              placeholder="Choose biller"
            />
          )}

          {/* 🔥 FORM */}
          {biller && (
            <div className="mt-4 space-y-4">
              {biller.customerParams.map((field, i) => {
                const Icon = getIcon(field.paramName);

                return (
                  <InputField
                    key={i}
                    label={field.paramName}
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
                name={isLoading ? "Loading..." : "Fetch Bill"}
                isOpen={handleSubmit}
                icon={CreditCard}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BbpsDynamicForm;
