import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateUserProfileImage } from "../../redux/slices/userSlice";
import { updateEmployeeProfileImage } from "../../redux/slices/employeeSlice";
import { toast } from "react-toastify";
import { User, Camera, X, Upload } from "lucide-react";

const EditProfileImageModal = ({
  user,
  onClose,
  onSuccess,
  type = "business",
}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user.profileImage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (JPEG, PNG, etc.)");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setProfileImage(file);
      setError(""); // Clear error

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(user.profileImage || "");
    setError(""); // Clear error
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profileImage) {
      setError("Please select an image to update");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("profileImage", profileImage);

      let res;

      // Use the new action with user ID
      if (type === "business") {
        res = await dispatch(updateUserProfileImage(user.id, formData));
      } else {
        res = await dispatch(updateEmployeeProfileImage(user.id, formData));
      }

      // ✅ Check multiple success patterns based on common Redux patterns
      const isSuccess = res?.success === true || res?.statusCode === 200;

      if (isSuccess) {
        toast.success(res.message);
        onSuccess();
        onClose();
      } else {
        const errorMessage = res?.message || setError(errorMessage);
      }
    } catch (error) {
      console.error("Profile image update error:", error);
      setError(error.message || "Failed to update profile image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">
            Update Profile Image
          </h2>
          <p className="text-blue-100 text-sm">
            Upload a new profile picture for {user.firstName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* ✅ Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Image Preview and Upload */}
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400 m-auto mt-6" />
                )}
              </div>

              {/* Remove Image Button */}
              {profileImage && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload Button */}
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                id="profileImageInput"
                disabled={loading}
              />
              <label
                htmlFor="profileImageInput"
                className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  loading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                {profileImage ? "Change Image" : "Choose Image"}
              </label>

              <p className="text-xs text-gray-500 mt-2">
                JPEG, PNG, WebP (Max 5MB)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !profileImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Update Image
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileImageModal;
