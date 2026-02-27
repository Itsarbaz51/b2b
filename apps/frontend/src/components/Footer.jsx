import { Link, useLocation } from "react-router-dom";
import { protectedRoute } from "../../index";
import { HashLink } from "react-router-hash-link";

export default function Footer() {
  const location = useLocation();
  const matchPath = (allowedPath, currentPath) => {
    const pattern = new RegExp(
      "^" + allowedPath.replace(/:\w+/g, "[^/]+") + "$"
    );
    return pattern.test(currentPath);
  };

  const isProtectedRoute = protectedRoute.some((path) =>
    matchPath(path, location.pathname)
  );

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
              <img
                src="WhatsApp Image 2025-10-10 at 11.48.12 AM.jpeg"
                alt="Mahi Pay Logo"
                className="w-16 h-16 object-contain"
              />
              <span className="font-bold text-lg text-gray-900">Mahi Pay</span>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              Mahi Pay offers secure, seamless, and fee-free payments for
              effortless global transactions.
            </p>
          </div>

          {/* Middle Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Short links</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>
                <HashLink to="/#feature">Features</HashLink>
              </li>
              {/* <li>
                <a href="#">How it works</a>
              </li>
              <li>
                <a href="#">Security</a>
              </li> */}
              <li>
                <HashLink to="/#testimonial">Testimonial</HashLink>
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
          </div>
        </div>
      )}

      {/* Always show copyright section on all routes */}
      <div className="border-t border-gray-300 mt-6 ">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex gap-4 mb-4 md:mb-0">
            <a href="#">Get This Turch</a>
            <a href="#">mahipay.com</a>
          </div>
          <div>
            2025 © <Link to={"https://azzunique.com/"}>azzunique.com</Link>
            {/* <Link to={""}>Samir</Link>
            rights reserved. Developed by <Link to={"https://in.linkedin.com/in/arbazfullstackdeveloper"}>Arbaz </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
