export const checkPermission = (user, permission, action = "view") => {
  if (!user) return false;

  const roleType = user?.role?.type;
  const roleName = user?.role?.name || user?.role;

  // ADMIN bypass
  if (roleName === "ADMIN") return true;

  // EMPLOYEE PERMISSIONS
  if (roleType === "employee") {
    return user?.permissions?.includes(permission);
  }

  // BUSINESS SERVICE PERMISSIONS
  if (roleType === "business") {
    const servicePermission = user?.permissions?.find(
      (p) => p.service?.code === permission,
    );

    if (!servicePermission) return false;

    if (action === "process") {
      return servicePermission?.canProcess || false;
    }

    // default = view
    return servicePermission?.canView || false;
  }

  return false;
};

export const getServiceId = (user, serviceCode) => {
  const permission = user?.permissions?.find(
    (p) => p?.service?.code === serviceCode,
  );

  return permission?.service?.id || null;
};
