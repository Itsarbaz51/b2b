import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Building, User, Download } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addBank,
  getAllMyBanks,
  updateBank,
  deleteBank,
} from "../redux/slices/bankSlice";
import AddBank from "../components/forms/AddBank";
import RefreshToast from "../components/ui/RefreshToast";
import ConfirmCard from "../components/ui/ConfirmCard";

export const AccountType = Object.freeze({
  PERSONAL: "PERSONAL",
  BUSINESS: "BUSINESS",
});

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECT: "bg-red-50 text-red-700 border border-red-200",
};

const CompanyAccounts = () => {
  const dispatch = useDispatch();
  const [accountForm, setAccountForm] = useState({
    accountHolder: "",
    accountNumber: "",
    phoneNumber: "",
    accountType: AccountType.PERSONAL,
    ifscCode: "",
    bankName: "",
    bankProofFile: null,
    isPrimary: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(null);

  const { myBankList, isLoading } = useSelector((state) => state.bank);

  const fetchHandle = useCallback(() => {
    dispatch(getAllMyBanks());
  }, [dispatch]);

  useEffect(() => {
    fetchHandle();
  }, [fetchHandle]);

  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        setFormErrors((prev) => ({
          ...prev,
          bankProofFile: "File size should not exceed 3 MB.",
        }));
        setAccountForm((prev) => ({ ...prev, bankProofFile: null }));
        return;
      }

      setAccountForm((prev) => ({ ...prev, bankProofFile: file }));
      if (formErrors.bankProofFile)
        setFormErrors((prev) => ({ ...prev, bankProofFile: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!accountForm.accountHolder.trim())
      errors.accountHolder = "Account holder name is required.";
    if (!accountForm.accountNumber.trim())
      errors.accountNumber = "Account number is required.";
    if (!accountForm.phoneNumber.trim())
      errors.phoneNumber = "Phone number is required.";
    if (!accountForm.ifscCode.trim())
      errors.ifscCode = "IFSC code is required.";
    if (!accountForm.bankName.trim())
      errors.bankName = "Bank name is required.";
    if (!editingAccountId && !accountForm.bankProofFile)
      errors.bankProofFile = "Bank proof file is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setAccountForm({
      accountHolder: "",
      accountNumber: "",
      phoneNumber: "",
      accountType: AccountType.PERSONAL,
      ifscCode: "",
      bankName: "",
      bankProofFile: null,
      isPrimary: false,
    });
    setFormErrors({});
    setEditingAccountId(null);
    setShowAccountForm(false);
  };

  const handleAddAccount = async () => {
    if (!validateForm()) return;
    const formData = new FormData();
    Object.entries(accountForm).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value);
    });

    const result = await dispatch(addBank(formData));

    if (result?.success) {
      await dispatch(getAllMyBanks());
      resetForm();
    }
  };

  const handleEditAccount = async () => {
    if (!validateForm()) return;
    const formData = new FormData();
    Object.entries(accountForm).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value);
    });
    const result = await dispatch(
      updateBank({ id: editingAccountId, data: formData })
    );
    console.log(result);

    if (result?.success) {
      await dispatch(getAllMyBanks());
      resetForm();
    }
  };

  const handleEditClick = (account) => {
    setAccountForm({
      accountHolder: account.accountHolder,
      accountNumber: account.accountNumber,
      phoneNumber: account.phoneNumber,
      accountType: account.accountType,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      bankProofFile: account.bankProofFile || null,
      isPrimary: account.isPrimary,
    });
    setEditingAccountId(account.id);
    setShowAccountForm(true);
  };

  const confirmDelete = async () => {
    if (!selectedBankId) return;
    await dispatch(deleteBank(selectedBankId));
    await dispatch(getAllMyBanks());
    setSelectedBankId(null);
    setShowConfirm(false);
  };

  const cancelDelete = () => {
    setSelectedBankId(null);
    setShowConfirm(false);
  };

  const handleDeleteClick = (id) => {
    setSelectedBankId(id);
    setShowConfirm(true);
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const getAccountTypeIcon = (type) => {
    return type === AccountType.BUSINESS ? (
      <Building className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bank Accounts</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Manage your company's banking information and verification status
        </p>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xs bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this bank account? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Accounts Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Bank Accounts
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {Object.values(myBankList || {}).filter(Boolean).length}{" "}
                account(s) registered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RefreshToast isLoading={isLoading} onClick={fetchHandle} />
              <button
                onClick={() => setShowAccountForm(!showAccountForm)}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Account Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {Object.values(myBankList || {}).filter(Boolean).length > 0 ? (
                  Object.values(myBankList || {})
                    .filter((account) => account && typeof account === "object")
                    .map((account) => (
                      <React.Fragment key={account.id || account.accountNumber}>
                        {account?.bankRejectionReason && (
                          <tr className="bg-red-50/50">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="flex items-center text-red-700 text-sm">
                                <div className="bg-red-100 rounded-full p-1 mr-3">
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Rejection Reason:
                                  </span>{" "}
                                  {account.bankRejectionReason}
                                  <span className="text-red-600 ml-2">
                                    (Account: {account.accountNumber})
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {getInitials(account?.accountHolder || "NA")}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {account?.accountHolder || "-"}
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {account?.phoneNumber || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="font-mono text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                              {String(account?.accountNumber || "-")}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                  account?.accountType === AccountType.BUSINESS
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {getAccountTypeIcon(account?.accountType)}
                                <span className="ml-1.5">
                                  {account?.accountType === AccountType.BUSINESS
                                    ? "Business"
                                    : "Personal"}
                                </span>
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {account?.status ? (
                              <span
                                className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full ${
                                  statusStyles[account.status.toUpperCase()] ||
                                  "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {account.status.charAt(0).toUpperCase() +
                                  account.status.slice(1).toLowerCase()}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              {account?.bankProofFile ? (
                                <a
                                  href={account.bankProofFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative"
                                >
                                  <div className="w-14 h-14 rounded-xl border-2 border-gray-200 group-hover:border-blue-300 overflow-hidden shadow-sm transition-all">
                                    <img
                                      src={account.bankProofFile}
                                      alt={account.bankName || "Bank Proof"}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-black/30 bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-xl flex items-center justify-center">
                                    <Download className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </a>
                              ) : (
                                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-xs border border-gray-200">
                                  No Image
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {account?.bankName || "-"}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  IFSC: {account?.ifscCode || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditClick(account)}
                                className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(account?.id)}
                                className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg
                          className="h-16 w-16 mx-auto opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div className="text-gray-500 text-lg font-medium mb-2">
                        No bank accounts found
                      </div>
                      <div className="text-gray-400 text-sm max-w-sm mx-auto">
                        Get started by adding your first company bank account to
                        manage payments and transfers
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAccountForm && (
          <AddBank
            accountForm={accountForm}
            errors={formErrors}
            accountTypes={Object.values(AccountType).map((t) => ({
              value: t,
              label: t === "PERSONAL" ? "Personal Account" : "Business Account",
            }))}
            onChange={handleAccountChange}
            onFileChange={handleFileChange}
            onSubmit={editingAccountId ? handleEditAccount : handleAddAccount}
            onCancel={resetForm}
            editingAccountId={editingAccountId}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default CompanyAccounts;
