import AuditLog from '../models/AuditLog.js';

export const logAction = async ({
  action,
  entityType,
  entityId,
  performedBy = 'System',
  details = {}
}) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      details
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
};
