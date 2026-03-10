export const checkPermission = (user, permission) => {
  if (!user) return false;

  const roleType = user?.role?.type;
  const roleName = user?.role?.name || user?.role;

  if (roleName === "ADMIN") return true;

  if (roleType === "employee") {
    return user?.userPermissions?.includes(permission);
  }

  if (roleType === "business") {
    const servicePermission = user?.userPermissions?.find(
      (p) => p.service?.code === permission,
    );

    return servicePermission?.canView || false;
  }

  return false;
};
