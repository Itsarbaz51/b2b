import { Navigate, Outlet } from "react-router-dom";

export default function RequireRole({ allowedRoles }) {
  const currentUserData = { role: "SUPER_ADMIN" };

  //   if (isLoading) {
  //     return <Loading />;
  //   }

  if (
    !currentUserData.role == "ADMIN" ||
    !currentUserData?.role === "RETAILER" ||
    !currentUserData?.role === "SUPER_ADMIN"
  ) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = currentUserData?.role?.toUpperCase();
  if (!allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
