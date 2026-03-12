import { useSelector } from "react-redux";
import { checkPermission } from "../../utils/permissionChecker";

export const usePermissions = () => {
  const user = useSelector((state) => state.auth.currentUser);

  const roleType = user?.role?.type;

  const isEmployee = roleType === "employee";

  const normalizedPermissions =
    roleType === "employee"
      ? user?.userPermissions || []
      : user?.userPermissions?.map((p) => ({
          code: p.service?.code,
          id: p.service?.id,
        })) || [];

  const canAccessRoute = (path) => {
    if (!path) return false;

    // "/dashboard" → "dashboard"
    const permission = path.split("/")[1].replace("-", "_");

    if (!permission) return true;

    return checkPermission(user, permission);
  };

  return {
    normalizedPermissions,
    canAccessRoute,
    isEmployee,
  };
};
