import {
  listAllowedReportsForUser,
  getReportFilterOptions,
  generateReportPdf,
  getAdminReportPermissions,
  updateAdminReportPermissions,
} from '../services/reportService.js';

// GET /api/reports - List reports permitted for current user
export const getReportsList = async (req, res) => {
  try {
    const reports = listAllowedReportsForUser(req.user);
    res.json({ reports });
  } catch (err) {
    console.error("Error listing reports:", err);
    res.status(500).json({ error: err.message || "Unable to list reports" });
  }
};

// GET /api/reports/:reportName/filters - Get filter configuration and dropdown options
export const getFilters = async (req, res) => {
  try {
    const { reportName } = req.params;
    const filterOptions = await getReportFilterOptions(reportName, req.user);
    res.json(filterOptions);
  } catch (err) {
    console.error("Error getting report filters:", err);
    res.status(400).json({ error: err.message || "Unable to load report filters" });
  }
};

// POST /api/reports/:reportName/generate - Generate & stream PDF report
export const generatePdf = async (req, res) => {
  try {
    const { reportName } = req.params;
    const filters = req.body || {};

    const pdfBuffer = await generateReportPdf(reportName, filters, req.user);

    const fileName = `${reportName}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating report PDF:", err);

    if (err.code === 'NO_DATA') {
      return res.status(404).json({ error: err.message });
    }

    res.status(400).json({ error: err.message || "Failed to generate report PDF" });
  }
};

// GET /api/reports/permissions/:adminId (SUPER_ADMIN only)
export const getPermissions = async (req, res) => {
  try {
    const { adminId } = req.params;
    const user = await getAdminReportPermissions(adminId);
    res.json({ user });
  } catch (err) {
    console.error("Error fetching report permissions:", err);
    res.status(400).json({ error: err.message || "Unable to fetch report permissions" });
  }
};

// PUT /api/reports/permissions/:adminId (SUPER_ADMIN only)
export const updatePermissions = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { allowedReports } = req.body;

    const updatedUser = await updateAdminReportPermissions(
      adminId,
      allowedReports,
      req.user?.email
    );

    res.json({
      message: "Report permissions updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating report permissions:", err);
    res.status(400).json({ error: err.message || "Failed to update report permissions" });
  }
};
