import { useState } from "react";
import { ChevronDown, Settings, User, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { protectedRoute } from "../../index"; // make sure this is an array of paths like ['/dashboard', '/settings']
import Title from "./ui/Title";
import { useSelector } from "react-redux";
import { HashLink } from "react-router-hash-link";

const Navbar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);

  // --- Path Matcher for protected routes ---
  const matchPath = (allowedPath, currentPath) => {
    const pattern = new RegExp(
      "^" + allowedPath.replace(/:\w+/g, "[^/]+") + "$"
    );
    return pattern.test(currentPath);
  };

  const isProtectedRoute = protectedRoute?.some((path) =>
    matchPath(path, location.pathname)
  );

  // --- Menu Items ---
  const menuItems = [
    { name: "Home", link: "/" },
    { name: "About", link: "/about" },
    { name: "Testimonial", hashLink: "/#testimonial" },
    { name: "Contact", link: "/contact" },
  ];

  // --- Toggle Mobile Menu ---
  const toggleMobileMenu = () => setIsMobileOpen((prev) => !prev);

  // --- Protected Navbar Rendering ---
  if (isProtectedRoute) {
    return (
      <nav className="py-4 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex justify-between items-center px-6">
          <Title />
          <div className="flex items-center space-x-3">
            {currentUser?.role?.name === "ADMIN" && (
              <button
                onClick={() => navigate("/settings")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Settings"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <button
              onClick={() => navigate(`/profile/${currentUser?.id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Profile"
            >
              <User className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // --- Public Navbar Rendering ---
  return (
    <nav className="border-b border-gray-300 flex items-center justify-between px-6 md:px-8 py-4 backdrop-blur-2xl sticky top-0 z-50 bg-white/90">
      {/* LOGO */}
      <Link to="/" className="flex items-center space-x-2">
        <img
          src="/WhatsApp Image 2025-10-10 at 11.48.12 AM.jpeg"
          alt="Impulse"
          className="h-fit w-24 object-contain"
        />
      </Link>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center bg-white shadow px-6 py-2 rounded-full space-x-8">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            className="relative"
            onMouseEnter={() => setOpenDropdown(item.name)}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            {item.hashLink ? (
              <HashLink
                to={item.hashLink}
                className={`font-medium transition ${
                  location.pathname === item.link
                    ? "text-black font-semibold"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {item.name}
              </HashLink>
            ) : (
              <Link
                to={item.link}
                className={`font-medium transition ${
                  location.pathname === item.link
                    ? "text-black font-semibold"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {item.name}
              </Link>
            )}

            {/* DROPDOWN MENU */}
            {openDropdown === item.name && item.dropdown && (
              <div className="absolute left-0 mt-3 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                {item.dropdown.map((sub, i) => (
                  <Link
                    key={i}
                    to={sub.link}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP BUTTONS */}
      <div className="hidden md:flex items-center space-x-4">
        <Link
          to="/login"
          className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition"
        >
          Login
        </Link>
        
      </div>

      {/* MOBILE MENU TOGGLE */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        onClick={toggleMobileMenu}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* MOBILE MENU */}
      {isMobileOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md flex flex-col items-center space-y-4 py-4 md:hidden z-50">
          {menuItems.map((item, idx) =>
            item.dropdown ? (
              <div key={idx} className="w-full text-center">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === item.name ? null : item.name
                    )
                  }
                  className="w-full py-2 font-medium text-gray-800 hover:text-black"
                >
                  {item.name} <ChevronDown className="inline" size={14} />
                </button>
                {openDropdown === item.name && (
                  <div className="flex flex-col space-y-1">
                    {item.dropdown.map((sub, i) => (
                      <Link
                        key={i}
                        to={sub.link}
                        onClick={() => setIsMobileOpen(false)}
                        className="block text-gray-600 hover:text-black text-sm"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={idx}
                to={item.link}
                onClick={() => setIsMobileOpen(false)}
                className={`text-gray-800 font-medium ${
                  location.pathname === item.link
                    ? "text-black font-semibold"
                    : ""
                }`}
              >
                {item.name}
              </Link>
            )
          )}

          {/* Login / Register Buttons for Mobile */}
          <div className="flex flex-col space-y-2 mt-3 w-full px-6">
            <Link
              to="/login"
              onClick={() => setIsMobileOpen(false)}
              className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition text-center"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMobileOpen(false)}
              className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-900 transition text-center"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
