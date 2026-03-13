import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_CONFIG } from "../utils/constants";
import { usePermissions } from "../components/hooks/usePermission";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const permissions = usePermissions();
  const currentPath = location.pathname;

  /* PUBLIC ROUTES */
  if (ROUTE_CONFIG.PUBLIC.includes(currentPath)) {
    return children;
  }

  /* AUTH CHECK */
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /* STATUS CHECK */
  if (["DELETE", "IN_ACTIVE"].includes(currentUser.status)) {
    if (["/unauthorized", "/logout"].includes(currentPath)) return children;
    return <Navigate to="/unauthorized" replace />;
  }

  const isBusinessUser = currentUser?.role?.type === "business";

  const primaryWallet = currentUser?.wallets?.find(
    (w) => w.walletType === "PRIMARY"
  );

  const walletBalance = Number(primaryWallet?.balance || 0);

  /* ---------------- WALLET CHECK ---------------- */

  if (
    isBusinessUser &&
    walletBalance < 100 &&
    !["/add-fund"].includes(currentPath)
  ) {
    return <Navigate to="/add-fund" replace />;
  }

  /* ---------------- KYC CHECK ---------------- */

  if (
    isBusinessUser &&
    walletBalance >= 100 &&
    !currentUser?.isKycVerified &&
    !["/kyc-submit"].includes(currentPath)
  ) {
    return <Navigate to="/kyc-submit" replace />;
  }

  if (currentPath === "/kyc-submit" && currentUser?.isKycVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  /* ---------------- EMPLOYEE PERMISSIONS ---------------- */

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