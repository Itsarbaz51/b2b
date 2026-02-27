import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Bank({ viewedBank, onClose, isOpen }) {

const [lightboxImage, setLightboxImage] = useState(null);

const formatDate = (dateString) => {
  return dateString
    ? new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";
};


  const getStatusColor = (status) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-700";
      case "REJECT":
        return "bg-red-100 text-red-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!viewedBank) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Bank Account Details
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Added on {formatDate(viewedBank.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 rounded-full p-2 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status */}
            {viewedBank.status && (
              <div className="flex justify-end">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    viewedBank.status
                  )}`}
                >
                  {viewedBank.status}
                </span>
              </div>
            )}

            {/* Rejection reason */}
            {viewedBank.bankRejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <strong>Rejection Reason:</strong>{" "}
                {viewedBank.bankRejectionReason}
              </div>
            )}

            {/* Account Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-500 text-white text-lg font-semibold">
                  {viewedBank.accountHolder?.[0] || "A"}
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-bold text-gray-900">
                    {viewedBank.accountHolder}
                  </h4>
                  <div className="text-sm text-gray-500">
                    Account No:{" "}
                    <span className="font-mono text-gray-900">
                      {viewedBank.accountNumber}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Bank Name:{" "}
                    <span className="text-gray-900 font-medium">
                      {viewedBank.bankName}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    IFSC:{" "}
                    <span className="font-mono text-gray-900">
                      {viewedBank.ifscCode}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Type:{" "}
                    <span className="text-gray-900 font-medium capitalize">
                      {viewedBank.accountType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proof Image */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-blue-600" />
                <h5 className="text-lg font-semibold text-gray-900">
                  Bank Proof
                </h5>
              </div>

              {viewedBank.bankProofFile ? (
                <div
                  onClick={() => setLightboxImage(viewedBank.bankProofFile)}
                  className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                >
                  <img
                    src={viewedBank.bankProofFile}
                    alt="Bank Proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">View</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
                  No Preview Available
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 space-y-1">
              <p>Created: {formatDate(viewedBank.createdAt)}</p>
              <p>Last Updated: {formatDate(viewedBank.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox (only image, no PDF handling) */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center p-8">
            <img
              src={lightboxImage}
              alt="Bank Proof Preview"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              Bank Proof
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Bank;
