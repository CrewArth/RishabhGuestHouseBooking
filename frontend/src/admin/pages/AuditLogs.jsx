import React, { useEffect, useState } from 'react';
import axios from 'axios';
// In AuditLogs.jsx
import '../styles/auditLogs.css';


const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/audit-logs');
        setLogs(response.data.logs || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };
    fetchLogs();
  }, []);

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
        <strong><h1>Audit Logs</h1></strong>
        <span className="count">Total Logs: {logs.length}</span>
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
                  <td>{log.details && JSON.stringify(log.details)}</td>
                  <td className="audit-timestamp">{formatDate(log.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
