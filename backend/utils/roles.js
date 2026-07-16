export const normalizeRole = (role) => {
  if (role == null) {
    return null;
  }

  const trimmedRole = String(role).trim();

  if (!trimmedRole) {
    return null;
  }

  if (trimmedRole === 'admin') {
    return 'SUPER_ADMIN';
  }

  if (trimmedRole === 'user') {
    return 'ADMIN';
  }

  const upperRole = trimmedRole.toUpperCase();

  if (upperRole === 'SUPER_ADMIN' || upperRole === 'SUPER-ADMIN') {
    return 'SUPER_ADMIN';
  }

  if (upperRole === 'ADMIN') {
    return 'ADMIN';
  }

  if (upperRole === 'USER') {
    return 'ADMIN';
  }

  return upperRole;
};

export const normalizeUser = (user) => {
  if (!user) {
    return user;
  }

  return {
    ...user,
    role: normalizeRole(user.role),
  };
};