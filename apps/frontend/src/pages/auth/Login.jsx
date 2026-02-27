import { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock, MapPinOff, MapPin } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, passwordReset } from "../../redux/slices/authSlice";

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });
  const [retryCount, setRetryCount] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, error, success, isLoading, isAuthenticated } =
    useSelector((state) => state.auth);

  // Get user location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = (isRetry = false) => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser.",
        loading: false,
      }));
      return;
    }

    if (isRetry) {
      setLocation((prev) => ({ ...prev, loading: true, error: null }));
      setRetryCount((prev) => prev + 1);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permissionDenied: false,
        });
        setRetryCount(0);
      },
      (error) => {
        console.warn("Location access denied or unavailable:", error);

        let errorMessage = "Location access denied";
        let permissionDenied = false;

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = isRetry
            ? "Location permission still denied. Please enable location in your browser settings."
            : "Location access denied. Please enable location services to login.";
          permissionDenied = true;
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage =
            "Location information unavailable. Please check your connection.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again.";
        } else {
          errorMessage = "An unknown error occurred while getting location.";
        }

        setLocation({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: errorMessage,
          loading: false,
          permissionDenied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 0, // Don't use cached position
      }
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!emailOrUsername || !password) {
      return;
    }

    // Check if location access is denied
    if (location.error) {
      return; // Prevent login if location error exists
    }

    // Check if location is still loading
    if (location.loading) {
      return;
    }

    const payload = {
      emailOrUsername: emailOrUsername.trim(),
      password: password.trim(),
      ...(location.latitude && { latitude: location.latitude }),
      ...(location.longitude && { longitude: location.longitude }),
      ...(location.accuracy && { accuracy: location.accuracy }),
    };

    try {
      await dispatch(login(payload));
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      return;
    }

    try {
      await dispatch(passwordReset(forgotPasswordEmail.trim()));
      setForgotPasswordEmail("");
    } catch (err) {
      console.error("Forgot password failed:", err);
    }
  };

  // Improved retry location access
  const handleRetryLocation = () => {
    // If permission was denied, guide user to browser settings
    if (location.permissionDenied && retryCount >= 1) {
      alert(
        "Please enable location permissions in your browser settings and try again."
      );
      return;
    }

    getLocation(true);
  };

  // Open browser location settings guide
  const handleOpenLocationSettings = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      alert(
        "Please go to your device Settings > Site Settings > Location and allow location access for this website."
      );
    } else {
      alert(
        "Please check your browser's address bar for a location icon (📍) and click it to allow location access, or go to browser Settings > Privacy and Security > Site Settings > Location."
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Small delay to ensure auth state is fully updated
      const timer = setTimeout(() => {
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser, navigate, location]);

  // Check if login button should be disabled
  const isLoginDisabled = isLoading || location.loading || !!location.error;

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {showForgotPassword ? "Reset Password" : "Welcome Back"}
            </h2>
            <p className="text-blue-100 text-sm">
              {showForgotPassword
                ? "Enter your email to reset your password"
                : "Sign in to your account to continue"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Error and Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Location Status */}
          {location.loading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-blue-700 text-sm">
                  {retryCount > 0
                    ? "Retrying location..."
                    : "Getting your location..."}
                </p>
              </div>
            </div>
          )}

          {location.error && !showForgotPassword && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-start">
                <MapPinOff className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-medium mb-2">
                    {location.error}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleRetryLocation}
                      disabled={location.loading}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {location.loading ? "Retrying..." : "Retry Location"}
                    </button>
                    {location.permissionDenied && retryCount >= 1 && (
                      <button
                        onClick={handleOpenLocationSettings}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                      >
                        Enable in Settings
                      </button>
                    )}
                  </div>
                  {location.permissionDenied && (
                    <p className="text-red-600 text-xs mt-2">
                      {retryCount >= 1
                        ? "You've already tried retrying. Please enable location permissions in your browser settings."
                        : "Click 'Retry Location' and allow location access when prompted."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!location.error && !location.loading && location.latitude && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-green-600 mr-2" />
                <div>
                  <p className="text-green-700 text-sm font-medium">
                    Location services enabled
                  </p>
                  <p className="text-green-600 text-xs">
                    Accuracy: ±{Math.round(location.accuracy)} meters
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Form */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your registered email"
                  disabled={isLoading}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Sending..." : "Reset Password"}
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  We'll send password reset instructions to your email
                </p>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Username *
                </label>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter email or username"
                  disabled={isLoading || location.loading}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading || location.loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading || location.loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={isLoading || location.loading}
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoginDisabled}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : location.loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Getting Location...
                  </div>
                ) : location.error ? (
                  "Location Required"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Footer Info */}
          {!showForgotPassword && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-500 mb-2">
                  <Lock className="h-3 w-3 mr-1" />
                  <p className="text-xs">Your credentials are secure</p>
                </div>
                <p className="text-xs text-gray-500">
                  Use your registered Email or Username to login
                </p>
                {location.error && (
                  <p className="text-xs text-red-600 mt-1 flex items-center justify-center">
                    <MapPinOff className="h-3 w-3 mr-1" />
                    Location access required for login
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
