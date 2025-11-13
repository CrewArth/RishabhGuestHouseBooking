import React, { useEffect, useState } from 'react';
import axios from 'axios';
// In AuditLogs.jsx
import '../styles/auditLogs.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchLogs = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/audit-logs?page=${currentPage}&limit=${limit}`
      );

      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-content">
      <div className="audit-logs-header">
        <h1>Audit Logs</h1>
      </div>

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Performed By</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id}>
                  <td><span className={`audit-action ${log.action}`}>{log.action}</span></td>
                  <td>{log.entityType}</td>
                  <td>{log.performedBy}</td>
                  <td>{log.details ? JSON.stringify(log.details) : "-"}</td>
                  <td className="audit-timestamp">{formatDate(log.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ← Prev
        </button>

        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default AuditLogs;
