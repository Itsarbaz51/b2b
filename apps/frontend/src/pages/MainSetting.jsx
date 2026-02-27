import { useState, useEffect } from "react";
import { Upload, Save, Loader2, X } from "lucide-react";
import {
  fetchSystemSetting,
  upsertSystemSetting,
} from "../redux/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { InputField } from "../components/ui/InputField";
import { FileUpload } from "../components/ui/FileUpload";

const MainSetting = () => {
  const dispatch = useDispatch();
  const {
    data = null,
    loading: isLoading,
    error,
    success,
  } = useSelector((state) => state.setting || {});

  const [formData, setFormData] = useState({
    companyName: "",
    companyLogo: "",
    favIcon: "",
    phoneNumber: "",
    whtsappNumber: "",
    companyEmail: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  // File validation function
  const validateFile = (file, maxSizeMB = 5) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed"
      );
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    return true;
  };

  // Fetch settings when component loads
  useEffect(() => {
    dispatch(fetchSystemSetting());
  }, [dispatch]);

  // Set data from Redux into form when fetched
  useEffect(() => {
    if (data) {
      setFormData({
        companyName: data.companyName || "",
        companyLogo: data.companyLogo || "",
        favIcon: data.favIcon || "",
        phoneNumber: data.phoneNumber || "",
        whtsappNumber: data.whtsappNumber || "",
        companyEmail: data.companyEmail || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        twitterUrl: data.twitterUrl || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
      });

      if (data.companyLogo) setLogoPreview(data.companyLogo);
      if (data.favIcon) setFaviconPreview(data.favIcon);
    }
  }, [data]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (faviconPreview && faviconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(faviconPreview);
      }
    };
  }, [logoPreview, faviconPreview]);

  // Input handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateFile(file);

        const preview = URL.createObjectURL(file);

        if (fieldName === "companyLogo") {
          setLogoPreview(preview);
          setLogoFile(file);
        } else if (fieldName === "favIcon") {
          setFaviconPreview(preview);
          setFaviconFile(file);
        }
      } catch (error) {
        toast.error(error.message);
        e.target.value = "";
      }
    }
  };

  //  HELPER: Convert input into FormData
  const buildFormData = (payload) => {
    const formData = new FormData();

    const textFields = [
      "companyName",
      "phoneNumber",
      "whtsappNumber",
      "companyEmail",
      "facebookUrl",
      "instagramUrl",
      "twitterUrl",
      "linkedinUrl",
      "websiteUrl",
    ];

    // Add all text fields
    textFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== null) {
        formData.append(field, payload[field]);
      }
    });

    // Company logo
    if (payload.companyLogo instanceof File) {
      formData.append("companyLogo", payload.companyLogo);
    } else if (typeof payload.companyLogo === "string" && payload.companyLogo) {
      formData.append("existingCompanyLogo", payload.companyLogo);
    }

    // Favicon
    if (payload.favIcon instanceof File) {
      formData.append("favIcon", payload.favIcon);
    } else if (typeof payload.favIcon === "string" && payload.favIcon) {
      formData.append("existingFavIcon", payload.favIcon);
    }

    return formData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      companyLogo: logoFile || formData.companyLogo,
      favIcon: faviconFile || formData.favIcon,
    };

    dispatch(upsertSystemSetting(buildFormData(payload)));
  };

  return (
    <div className="">
      <div className="">
        <div className="bg-white rounded-lg shadow-md p-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-2">
              Settings saved successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Company Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required={true}
                />

                <InputField
                  label="Company Email"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder="company@example.com"
                  required={false}
                />
              </div>

              {/* Logo Upload */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <FileUpload
                  label="Company Logo"
                  name="companyLogo"
                  accept="image/*"
                  icon={Upload}
                  onChange={(e) => handleFileChange(e, "companyLogo")}
                  filePreview={logoPreview}
                  file={logoFile}
                  error={null}
                  isPreFilled={!!formData.companyLogo}
                />

                <FileUpload
                  label="Favicon"
                  name="favIcon"
                  accept="image/*"
                  icon={Upload}
                  onChange={(e) => handleFileChange(e, "favIcon")}
                  filePreview={faviconPreview}
                  file={faviconFile}
                  error={null}
                  isPreFilled={!!formData.favIcon}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Contact Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  required={false}
                />

                <InputField
                  label="WhatsApp Number"
                  name="whtsappNumber"
                  type="tel"
                  value={formData.whtsappNumber}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  required={false}
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Social Media Links
              </h2>

              <div className="space-y-4">
                <InputField
                  label="Website URL"
                  name="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  required={false}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { field: "facebookUrl", label: "Facebook URL" },
                    { field: "instagramUrl", label: "Instagram URL" },
                    { field: "twitterUrl", label: "Twitter URL" },
                    { field: "linkedinUrl", label: "LinkedIn URL" },
                  ].map(({ field, label }) => (
                    <InputField
                      key={field}
                      label={label}
                      name={field}
                      type="url"
                      value={formData[field]}
                      onChange={handleChange}
                      placeholder={`https://${field.replace(
                        "Url",
                        ".com/..."
                      )}`}
                      required={false}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MainSetting;
