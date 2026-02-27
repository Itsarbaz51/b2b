import { AlertCircle, CheckCircle, FileText } from "lucide-react";

export const FileUpload = ({
  label,
  name,
  accept = "image/*,.pdf",
  icon: Icon,
  onChange,
  filePreview,
  file,
  error,
  isPreFilled = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className={`relative border-2 border-dashed ${
          error && !isPreFilled ? "border-red-500" : "border-gray-300"
        } rounded-lg p-6 hover:border-cyan-500 transition-colors cursor-pointer bg-gray-50`}
      >
        <input
          type="file"
          name={name}
          accept={accept}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          {filePreview ? (
            <div className="space-y-2">
              {/* Improved PDF Preview Logic */}
              {filePreview === "PDF" ||
              (file && file.type === "application/pdf") ? (
                <div className="flex flex-col items-center justify-center gap-2 p-3">
                  <div className="relative">
                    <FileText size={40} className="text-red-500" />
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      PDF
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-800 truncate max-w-[140px]">
                      {file?.name || `${label}.pdf`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {file
                        ? `Size: ${(file.size / 1024).toFixed(1)}KB`
                        : "PDF Document"}
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded-lg shadow-md"
                />
              )}
              <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                <CheckCircle size={12} />
                {isPreFilled
                  ? "File pre-filled from previous submission"
                  : "File uploaded successfully"}
              </p>
              {isPreFilled && (
                <p className="text-xs text-blue-600">
                  Click to upload new file
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Icon className="mx-auto text-gray-400" size={32} />
              <p className="text-sm text-gray-600">
                <span className="text-cyan-600 font-semibold">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG or PDF (max 150KB)
              </p>
            </div>
          )}
        </div>
      </div>
      {error && !isPreFilled && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};
