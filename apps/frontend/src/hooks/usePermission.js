import { useSelector } from "react-redux";

export const usePermissions = (serviceCode) => {
  const { currentUser } = useSelector((s) => s.auth);

  if (!currentUser) {
    return {
      canView: false,
      canProcess: false,
      providers: [],
      getProviderByCode: () => null,
      defaultProvider: null,
    };
  }

  const roleType = currentUser?.role?.type;

  if (roleType === "business") {
    const permission = currentUser?.permissions?.find(
      (p) => p?.service?.code === serviceCode,
    );

    const providers = permission?.providers || [];

    // 🔥 helper
    const getProviderByCode = (code) =>
      providers.find((p) => p.providerCode === code);

    return {
      canView: permission?.canView || false,
      canProcess: permission?.canProcess || false,
      providers,
      defaultProvider: providers[0] || null,
      getProviderByCode,
    };
  }

  if (roleType === "employee") {
    const normalizedService = serviceCode?.toLowerCase()?.replaceAll("_", " ");

    const allowed = currentUser?.permissions?.includes(normalizedService);

    return {
      canView: allowed,
      canProcess: allowed,
      providers: [],
      defaultProvider: null,
      getProviderByCode: () => null,
    };
  }

  return {
    canView: false,
    canProcess: false,
    providers: [],
    getProviderByCode: () => null,
    defaultProvider: null,
  };
};
