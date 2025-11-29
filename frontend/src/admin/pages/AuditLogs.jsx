import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/auditLogs.css';
import { FaFileExcel} from 'react-icons/fa';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDate, setExportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const limit = 10;

  const [selectedLog, setSelectedLog] = useState(null); // NEW

  // Filter state
  const [filterType, setFilterType] = useState("all");

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/audit-logs', {
        params: {
          page: currentPage,
          limit,
          entityType: filterType,
        },
      });

      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterType]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDetailsContent = (log) => {
    const details = log.details || {};

    if (log.entityType === 'GuestHouse') {
      return (
        <>
          {details.guestHouseName && (
            <p><strong>Guest House:</strong> {details.guestHouseName}</p>
          )}
          {details.location && (
            <p><strong>Location:</strong> {details.location}</p>
          )}
        </>
      );
    }

    if (log.entityType === 'Room') {
      return (
        <>
          {details.guestHouseName && (
            <p><strong>Guest House:</strong> {details.guestHouseName}</p>
          )}
          {details.roomNumber && (
            <p><strong>Room Number:</strong> {details.roomNumber}</p>
          )}
          {details.roomType && (
            <p><strong>Room Type:</strong> {details.roomType}</p>
          )}
        </>
      );
    }

    if (log.entityType === 'Bed') {
      return (
        <>
          {details.guestHouseName && (
            <p><strong>Guest House:</strong> {details.guestHouseName}</p>
          )}
          {details.roomNumber && (
            <p><strong>Room Number:</strong> {details.roomNumber}</p>
          )}
          {details.bedNumber && (
            <p><strong>Bed Number:</strong> {details.bedNumber}</p>
          )}
          {details.bedType && (
            <p><strong>Bed Type:</strong> {details.bedType}</p>
          )}
        </>
      );
    }

    if (log.entityType === 'Booking') {
      return (
        <>
          {details.user && (
            <>
              <p><strong>User:</strong> {details.user.name}</p>
              <p><strong>User Email:</strong> {details.user.email}</p>
              <p><strong>User Phone:</strong> {details.user.phone}</p>
            </>
          )}
          {details.guestHouse && (
            <p><strong>Guest House:</strong> {details.guestHouse}</p>
          )}
          {details.room && (
            <p><strong>Room:</strong> {details.room}</p>
          )}
          {details.bed && (
            <p><strong>Bed:</strong> {details.bed}</p>
          )}
          {details.checkIn && (
            <p><strong>Check-in:</strong> {new Date(details.checkIn).toLocaleString()}</p>
          )}
          {details.checkOut && (
            <p><strong>Check-out:</strong> {new Date(details.checkOut).toLocaleString()}</p>
          )}
          {details.status && (
            <p><strong>Status:</strong> {details.status}</p>
          )}
        </>
      );
    }

    if (log.entityType === 'User' && details.userDetails) {
      return (
        <>
          <p><strong>Name:</strong> {details.userDetails.name}</p>
          <p><strong>Email:</strong> {details.userDetails.email}</p>
          <p><strong>Phone:</strong> {details.userDetails.phone}</p>
          <p><strong>Active:</strong> {details.userDetails.isActive ? 'Yes' : 'No'}</p>
        </>
      );
    }

    return (
      <pre>{JSON.stringify(details, null, 2)}</pre>
    );
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await axios.get(
        'http://localhost:5000/api/audit-logs/export/daily',
        {
          params: { date: exportDate },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `audit-logs-${exportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="audit-logs-header">
        <strong><h2>Audit Logs</h2></strong>
        <div className="audit-export-wrapper">
          <input
            type="date"
            className="audit-export-date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
          />
          <button
            className="audit-export-btn"
            onClick={handleExport}
            disabled={isExporting || !exportDate}
          >
            <span className="export-icon" aria-hidden="true"><FaFileExcel /></span>
            {isExporting ? 'Generating...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="audit-filter-bar">
        <label>Filter by Entity:</label>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1); // Reset to first page when filter changes
          }}
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
            {logs.length > 0 ? (
              logs.map((log) => (
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
                {getDetailsContent(selectedLog)}
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
