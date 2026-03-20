import { Link, useLocation } from "react-router-dom";
import { protectedRoute } from "../../index";
import { HashLink } from "react-router-hash-link";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

export default function Footer() {
  const location = useLocation();
  const systemSetting  = useSelector((state) => state.setting?.data);

  const matchPath = (allowedPath, currentPath) => {
    const pattern = new RegExp(
      "^" + allowedPath.replace(/:\w+/g, "[^/]+") + "$",
    );
    return pattern.test(currentPath);
  };

  const isProtectedRoute = protectedRoute?.some((path) =>
    matchPath(path, location.pathname),
  );

  // Social media links from system settings
  const socialLinks = [
    { name: "Facebook", url: systemSetting?.facebookUrl, icon: "facebook" },
    { name: "Twitter", url: systemSetting?.twitterUrl, icon: "twitter" },
    { name: "Instagram", url: systemSetting?.instagramUrl, icon: "instagram" },
    { name: "LinkedIn", url: systemSetting?.linkedinUrl, icon: "linkedin" },
  ];

  return (
    <footer
      className={`${
        !isProtectedRoute && "bg-white border-t border-gray-300 "
      } px-6 md:px-8`}
    >
      {/* Show full footer only on public routes, show only copyright on protected routes */}
      {!isProtectedRoute && (
        <div className="px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {systemSetting?.companyLogo ? (
                <img
                  src={systemSetting.companyLogo}
                  alt={systemSetting.companyName || "Mahi Pay Logo"}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <img
                  src="/WhatsApp Image 2025-10-10 at 11.48.12 AM.jpeg"
                  alt="Mahi Pay Logo"
                  className="w-16 h-16 object-contain"
                />
              )}
              <span className="font-bold text-lg text-gray-900">
                {systemSetting?.companyName || "Mahi Pay"}
              </span>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              {systemSetting?.companyName || "Mahi Pay"} offers secure,
              seamless, and fee-free payments for effortless global
              transactions.
            </p>

            {/* Contact Info */}
            {(systemSetting?.phoneNumber || systemSetting?.companyEmail) && (
              <div className="mt-4 space-y-1">
                {systemSetting?.phoneNumber && (
                  <p className="text-sm text-gray-600">
                    📞 {systemSetting.phoneNumber}
                  </p>
                )}
                {systemSetting?.companyEmail && (
                  <p className="text-sm text-gray-600">
                    ✉️ {systemSetting.companyEmail}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Middle Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Short links</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>
                <HashLink to="/#feature">Features</HashLink>
              </li>
              <li>
                <HashLink to="/#testimonial">Testimonial</HashLink>
              </li>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Right Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Other pages</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>
                <HashLink to="/privacy-policy">Privacy policy</HashLink>
              </li>
              <li>
                <HashLink to="/terms-conditions">Terms & conditions</HashLink>
              </li>
            </ul>

            {/* Social Links */}
            {socialLinks.some((link) => link.url && link.url !== "#") && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Follow Us</h4>
                <div className="flex space-x-3">
                  {socialLinks.map(
                    (social) =>
                      social.url &&
                      social.url !== "#" && (
                        <a
                          key={social.name}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-indigo-600 transition"
                        >
                          {social.name}
                        </a>
                      ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Always show copyright section on all routes */}
      <div className="border-t border-gray-300 mt-6 ">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex gap-4 mb-4 md:mb-0">
            <HashLink to="/privacy-policy">Privacy Policy</HashLink>
            <HashLink to="/terms-conditions">Terms & Conditions</HashLink>
            <Link to="/contact">Get in Touch</Link>
          </div>
          <div>
            2025 © {systemSetting?.companyName || "Mahi Pay"}. All rights
            reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
