import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalLogs = await AuditLog.countDocuments();
    const totalPages = Math.ceil(totalLogs / limit);

    return res.json({
      success: true,
      logs,
      totalLogs,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, error: "Server error while fetching logs" });
  }
};


