const BbpsBillPreview = ({ bill, onBack, onPay }) => {
  const details = bill?.rawResponse?.data || bill;
  const tags = details.additionalData?.tag || [];

  return (
    <div className="space-y-4">
      {/*  TITLE */}
      <h2 className="text-lg font-semibold">
        {details.category || "Bill"} Details
      </h2>

      {/*  COMMON INFO */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 space-y-2">
        <p>
          <b>Customer:</b> {bill.billDetails.customerName}
        </p>
        <p>
          <b>Amount:</b> ₹{bill.amount}
        </p>
        <p>
          <b>Due Date:</b> {bill.billDetails.dueDate?.slice(0, 10)}
        </p>
      </div>

      {/*  BILL DETAILS (AUTO HANDLE ALL TYPES) */}
      <div className="bg-white border border-gray-300 p-4 rounded-lg space-y-2">
        {Object.entries(details.billDetails || {}).map(([key, value]) => {
          if (!value || key === "tag") return null;

          return (
            <p key={key}>
              <b>{key}:</b> {value}
            </p>
          );
        })}
      </div>

      {/*  ADDITIONAL DATA (DYNAMIC) */}
      {tags.length > 0 && (
        <div className="bg-white border border-gray-300 p-4 rounded-lg space-y-2">
          {tags.map((t, i) => (
            <p key={i}>
              <b>{t.name}:</b> {t.value}
            </p>
          ))}
        </div>
      )}

      {/*  ACTION */}
      <div className="flex gap-3">
        <button onClick={onBack} className="text-sm text-blue-600">
          ← Back
        </button>

        <button
          onClick={onPay}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Pay ₹{bill.amount}
        </button>
      </div>
    </div>
  );
};

export default BbpsBillPreview;
