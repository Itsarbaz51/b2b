import { useSelector } from "react-redux";

export const usePermissions = (serviceCode) => {
  const { currentUser } = useSelector((s) => s.auth);

  if (!currentUser) {
    return { canView: false, canProcess: false, serviceId: null };
  }

  const roleType = currentUser?.role?.type;

  // ---------------- BUSINESS USER ----------------
  if (roleType === "business") {
    const permission = currentUser?.permissions?.find(
      (p) => p?.service?.code === serviceCode,
    );

    return {
      canView: permission?.canView || false,
      canProcess: permission?.canProcess || false,
      serviceId: permission?.service?.id || null,
    };
  }

  // ---------------- EMPLOYEE USER ----------------
  if (roleType === "employee") {
    const allowed = currentUser?.permissions?.includes(
      serviceCode?.toLowerCase(),
    );

    return {
      canView: allowed,
      canProcess: allowed,
      serviceId: null,
    };
  }

  return {
    canView: false,
    canProcess: false,
    serviceId: null,
  };
};
