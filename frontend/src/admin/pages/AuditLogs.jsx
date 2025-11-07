import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

  return (
    <div className="audit-logs-container">
  <h1>Audit Logs</h1>
  <table className="audit-table">
    <thead>
      <tr>
        <th>Action</th>
        <th>Entity</th>
        <th>Details</th>
        <th>Performed By</th>
        <th>Timestamp</th>
      </tr>
    </thead>
    <tbody>
      {logs.map((log) => (
        <tr key={log._id}>
          <td>
            <span className={`audit-action ${log.action}`}>{log.action}</span>
          </td>
          <td>{log.entityType}</td>
          <td>{log.details && JSON.stringify(log.details)}</td>
          <td>{log.performedBy}</td>
          <td className="audit-timestamp">{new Date(log.createdAt).toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  );
};

export default AuditLogs;
