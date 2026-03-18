import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_CONFIG, SERVICES } from "../utils/constants";
import { usePermissions } from "../components/hooks/usePermission";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const currentPath = location.pathname;

  // PUBLIC ROUTES
  if (ROUTE_CONFIG.PUBLIC.includes(currentPath)) {
    return children;
  }

  const serviceCodeFromPath = currentPath
    .replace("/", "")
    .replaceAll("-", "_")
    .toUpperCase();

  const permission = usePermissions(serviceCodeFromPath);

  // AUTH CHECK
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // STATUS CHECK
  if (["DELETE", "IN_ACTIVE"].includes(currentUser.status)) {
    if (["/unauthorized", "/logout"].includes(currentPath)) return children;
    return <Navigate to="/unauthorized" replace />;
  }

  const isBusinessUser = currentUser?.role?.type === "business";

  const primaryWallet = currentUser?.wallets?.find(
    (w) => w.walletType === "PRIMARY",
  );

  const walletBalance = Number(primaryWallet?.balance || 0);

  // ---------------- WALLET CHECK ----------------
  if (
    isBusinessUser &&
    walletBalance === 0 &&
    !currentUser?.isKycVerified &&
    !["/add-fund"].includes(currentPath)
  ) {
    return <Navigate to="/add-fund" replace />;
  }

  // ---------------- KYC CHECK ----------------
  if (
    isBusinessUser &&
    walletBalance > 0 &&
    !currentUser?.isKycVerified &&
    !["/kyc-submit"].includes(currentPath)
  ) {
    return <Navigate to="/kyc-submit" replace />;
  }

  if (currentPath === "/kyc-submit" && currentUser?.isKycVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  // ---------------- SERVICE PERMISSIONS ----------------
  if (currentUser?.role?.type === "business") {
    if (Object.values(SERVICES).includes(serviceCodeFromPath)) {
      if (!permission.canView) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // ---------------- EMPLOYEE PERMISSIONS ----------------
  if (currentUser?.role?.type === "employee") {
    const employeePermissions = currentUser?.permissions || [];

    const permissionFromPath = currentPath
      .replace("/", "")
      .replaceAll("-", "_");

    if (!employeePermissions.includes(permissionFromPath)) {
      if (employeePermissions.includes("dashboard")) {
        return <Navigate to="/dashboard" replace />;
      }

      if (employeePermissions.length > 0) {
        const firstPermission = employeePermissions[0].replaceAll("_", "-");

        return <Navigate to={`/${firstPermission}`} replace />;
      }
      return <Navigate to="/permission-denied" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
