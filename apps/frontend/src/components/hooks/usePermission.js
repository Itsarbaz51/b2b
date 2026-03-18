import { useSelector } from "react-redux";

export const usePermissions = (serviceCode) => {
  const { currentUser } = useSelector((s) => s.auth);

  if (!currentUser) {
    return {
      canView: false,
      canProcess: false,
      providers: [],
      defaultProvider: null,
    };
  }

  const roleType = currentUser?.role?.type;

  // ---------------- BUSINESS USER ----------------
  if (roleType === "business") {
    const permission = currentUser?.permissions?.find(
      (p) => p?.service?.code === serviceCode,
    );

    const providers = permission?.providers || [];

    return {
      canView: permission?.canView || false,
      canProcess: permission?.canProcess || false,
      providers, // 🔥 ALL providers
      defaultProvider: providers[0] || null, // 🔥 first / priority
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
      providers: [],
      defaultProvider: null,
    };
  }

  return {
    canView: false,
    canProcess: false,
    providers: [],
    defaultProvider: null,
  };
};
