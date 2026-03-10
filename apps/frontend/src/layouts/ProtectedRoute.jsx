import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_CONFIG } from "../utils/constants";
import { usePermissions } from "../components/hooks/usePermission";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const permissions = usePermissions();
  const currentPath = location.pathname;

  // Public routes
  if (ROUTE_CONFIG.PUBLIC.includes(currentPath)) {
    return children;
  }

  // Authentication check
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // User status checks
  if (currentUser.status === "DELETE" || currentUser.status === "IN_ACTIVE") {
    if (["/unauthorized", "/logout"].includes(currentPath)) {
      return children;
    }
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  // KYC verification - Business users ke liye
  const isBusinessUser = [
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ].includes(currentUser.role?.name || currentUser.role);

  if (
    isBusinessUser &&
    !currentUser?.isKycVerified &&
    currentPath !== "/kyc-submit"
  ) {
    return <Navigate to="/kyc-submit" replace state={{ from: location }} />;
  }

  if (currentPath === "/kyc-submit" && currentUser?.isKycVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permissions.isEmployee) {
    if (!permissions.canAccessRoute(currentPath)) {
      if (permissions.normalizedPermissions.length === 0) {
        return <Navigate to="/permission-denied" replace />;
      }

      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

export default ProtectedRoute;
