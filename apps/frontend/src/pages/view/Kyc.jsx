import React, { useState, useEffect } from "react";
import {
  X,
  User,
  FileText,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
} from "lucide-react";

function Kyc({ viewedKyc, onClose }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECT":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isPDF = (url) => {
    return url?.toLowerCase().endsWith(".pdf");
  };

  const openLightbox = (url) => {
    if (isPDF(url)) {
      window.open(url, "_blank");
      return;
    }

    const images = [];

    if (viewedKyc?.files?.photo && !isPDF(viewedKyc.files.photo)) {
      images.push({ url: viewedKyc.files.photo, label: "Profile Photo" });
    }
    if (viewedKyc?.files?.panFile && !isPDF(viewedKyc.files.panFile)) {
      images.push({ url: viewedKyc.files.panFile, label: "PAN Card" });
    }
    if (viewedKyc?.files?.aadhaarFile && !isPDF(viewedKyc.files.aadhaarFile)) {
      images.push({ url: viewedKyc.files.aadhaarFile, label: "Aadhaar Card" });
    }
    if (
      viewedKyc?.files?.addressProofFile &&
      !isPDF(viewedKyc.files.addressProofFile)
    ) {
      images.push({
        url: viewedKyc.files.addressProofFile,
        label: "Address Proof",
      });
    }

    setAllImages(images);
    const index = images.findIndex((img) => img.url === url);
    setCurrentIndex(index);
    setLightboxImage(url);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setAllImages([]);
    setCurrentIndex(0);
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % allImages.length;
    setCurrentIndex(nextIndex);
    setLightboxImage(allImages[nextIndex].url);
  };

  const goToPrev = () => {
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setCurrentIndex(prevIndex);
    setLightboxImage(allImages[prevIndex].url);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
  };

  useEffect(() => {
    if (lightboxImage) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [lightboxImage, currentIndex]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                KYC Details
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Submitted on {formatDate(viewedKyc?.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 hover:bg-white/50 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status and Reject Reason */}
            <div className="flex justify-between items-center">
              {viewedKyc?.status && (
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    viewedKyc.status
                  )}`}
                >
                  {viewedKyc.status}
                </span>
              )}
              {viewedKyc?.rejectReason && (
                <div className="text-right">
                  <p className="text-sm text-red-600 font-medium">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-gray-700 max-w-md">
                    {viewedKyc.rejectReason}
                  </p>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start gap-6">
                {viewedKyc?.files?.photo && !isPDF(viewedKyc.files.photo) ? (
                  <img
                    src={viewedKyc.files.photo}
                    alt="Profile"
                    onClick={() => openLightbox(viewedKyc.files.photo)}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg">
                    {viewedKyc?.profile?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">
                      {viewedKyc?.profile?.name || "N/A"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      User ID: {viewedKyc?.profile?.userId || "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        {viewedKyc?.profile?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        {viewedKyc?.profile?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        DOB: {formatDate(viewedKyc?.profile?.dob)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        Gender: {viewedKyc?.profile?.gender || "N/A"}
                      </span>
                    </div>
                  </div>
                  {viewedKyc?.profile?.fatherName && (
                    <div className="text-sm">
                      <span className="text-gray-500">Father's Name: </span>
                      <span className="text-gray-700 font-medium">
                        {viewedKyc.profile.fatherName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parent Information */}
            {viewedKyc?.parent && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-green-600" />
                  <h5 className="text-lg font-semibold text-gray-900">
                    Parent Information
                  </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Parent Name</p>
                      <p className="font-medium text-gray-900">
                        {viewedKyc.parent.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Username</p>
                      <p className="font-medium text-gray-900">
                        {viewedKyc.parent.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hierarchy Level</p>
                      <p className="font-medium text-gray-900">
                        {viewedKyc.parent.hierarchyLevel}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {viewedKyc.parent.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">
                        {viewedKyc.parent.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hierarchy Path</p>
                      <p className="font-medium text-gray-900">
                        {viewedKyc.parent.hierarchyPath}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-blue-600" />
                <h5 className="text-lg font-semibold text-gray-900">
                  Identity Documents
                </h5>
              </div>
              {viewedKyc?.documents?.length > 0 ? (
                <div className="space-y-3">
                  {viewedKyc.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-700">
                        {doc.type}
                      </span>
                      <span className="font-mono text-sm text-gray-600 bg-white px-3 py-1 rounded border border-gray-200">
                        {doc.value || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents found.</p>
              )}
            </div>

            {/* Location */}
            {viewedKyc?.location && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={20} className="text-blue-600" />
                  <h5 className="text-lg font-semibold text-gray-900">
                    Address Details
                  </h5>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700">{viewedKyc.location.address}</p>
                  <p className="text-gray-600">
                    {viewedKyc.location.city}, {viewedKyc.location.state}
                  </p>
                  <p className="text-gray-600">
                    PIN: {viewedKyc.location.pinCode}
                  </p>
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {viewedKyc?.files && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-blue-600" />
                  <h5 className="text-lg font-semibold text-gray-900">
                    Uploaded Files
                  </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["panFile", "aadhaarFile", "addressProofFile"].map(
                    (fileKey) =>
                      viewedKyc.files[fileKey] && (
                        <div key={fileKey} className="space-y-2">
                          <div
                            onClick={() =>
                              openLightbox(viewedKyc.files[fileKey])
                            }
                            className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                          >
                            {isPDF(viewedKyc.files[fileKey]) ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                                <FileText
                                  size={48}
                                  className="text-red-500 mb-2"
                                />
                                <span className="text-sm font-medium text-red-700">
                                  PDF Document
                                </span>
                                <span className="text-xs text-red-600 mt-1">
                                  Click to view
                                </span>
                              </div>
                            ) : (
                              <img
                                src={viewedKyc.files[fileKey]}
                                alt={fileKey}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-medium">
                                {isPDF(viewedKyc.files[fileKey])
                                  ? "View PDF"
                                  : "View"}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 text-center">
                            {fileKey.replace("File", "").toUpperCase()}
                          </p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 space-y-1">
              <p>Created: {formatDate(viewedKyc?.createdAt)}</p>
              <p>Last Updated: {formatDate(viewedKyc?.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center p-8">
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            {allImages[currentIndex] && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {allImages[currentIndex].label} ({currentIndex + 1} /{" "}
                {allImages.length})
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Kyc;
