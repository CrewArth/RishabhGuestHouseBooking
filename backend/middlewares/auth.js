import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';
import { normalizeRole } from '../utils/roles.js';

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication is required' });
  }

  try {
    const token = authorization.slice(7);
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select(
      '_id email role isActive firstName lastName assignedGuestHouseId allowedWidgets allowedReports'
    );

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Your account is not active' });
    }

    req.user = {
      _id: user._id,
      email: user.email,
      role: normalizeRole(user.role),
      firstName: user.firstName,
      lastName: user.lastName,
      assignedGuestHouseId: user.assignedGuestHouseId,
      allowedWidgets: user.allowedWidgets,
      allowedReports: user.allowedReports,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session is invalid or expired' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }

  return next();
};
