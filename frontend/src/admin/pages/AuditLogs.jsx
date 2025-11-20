import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/auditLogs.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [selectedLog, setSelectedLog] = useState(null); // NEW

  // Filter state
  const [filterType, setFilterType] = useState("all");

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

  // Apply filter
  const filteredLogs = logs.filter((log) => {
    if (filterType === "all") return true;
    return log.entityType === filterType;
  });

  console.log(filteredLogs)

  return (
    <div className="admin-content">
      <div className="audit-logs-header">
      <strong><h2>Audit Logs</h2></strong>
      </div>

      {/* Filter */}
      <div className="audit-filter-bar">
        <label>Filter by Entity:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="GuestHouse">Guest House</option>
          <option value="Room">Room</option>
          <option value="Bed">Bed</option>
          <option value="User">User</option>
        </select>
      </div>

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Performed By</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span className={`audit-action ${log.action}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entityType}</td>
                  <td>{log.performedBy}</td>
                  <td className="audit-timestamp">{formatDate(log.createdAt)}</td>

                  {/* View details button */}
                  <td>
                    <button
                      className="view-details-btn"
                      onClick={() => setSelectedLog(log)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No logs found
                </td>
              </tr>
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

      {/* 🔵 Details Modal */}
      {selectedLog && (
        <div className="audit-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div
            className="audit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Log Details</h2>
            <div className="audit-modal-content">
              <p><strong>Action:</strong> {selectedLog.action}</p>
              <p><strong>Entity Type:</strong> {selectedLog.entityType}</p>
              <p><strong>Performed By:</strong> {selectedLog.performedBy}</p>
              <p><strong>Timestamp:</strong> {formatDate(selectedLog.createdAt)}</p>

              <div className="details-box">
                <strong>Details:</strong>
                <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
              </div>
            </div>

            <div className="audit-modal-actions">
              <button onClick={() => setSelectedLog(null)} className="close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditLogs;
