import { useEffect, useState } from "react";
import EditUserModal           from "../components/EditUserModel";
import CreateUserModal         from "../components/CreateUserModal";
import AssignGuestHouseModal   from "../components/AssignGuestHouseModal";
import { toast } from "react-toastify";
import api from "../../utils/api";

const UsersList = () => {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [err, setErr]                   = useState(null);
  const [isEditOpen, setIsEditOpen]         = useState(false);
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [isAssignOpen, setIsAssignOpen]     = useState(false);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const limit = 10;

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get(`/api/admin/users?page=${page}&limit=${limit}`);
      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (e) {
      setErr("Failed to load users");
      toast.error("Failed to load users");
    } finally { setLoading(false); }
  };

  const handleUpdate = async (updated) => {
    try {
      await api.put(`/api/users/${selectedUser._id}`, updated);
      toast.success("User updated");
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers(currentPage);
    } catch { toast.error("Failed to update user"); }
  };

  const handleToggle = async (user) => {
    try {
      const res = await api.patch(`/api/users/${user._id}/toggle`);
      toast.success(res.data.message);
      fetchUsers(currentPage);
    } catch { toast.error("Failed to update user status"); }
  };

  useEffect(() => { fetchUsers(currentPage); }, [currentPage]);

  const filtered = users.filter((u) => {
    if (statusFilter === "active")   return u.isActive === true;
    if (statusFilter === "inactive") return u.isActive === false;
    return true;
  });

  if (loading) return <div className="page-root"><p style={{ color: "#64748b" }}>Loading users…</p></div>;
  if (err)     return <div className="page-root"><p style={{ color: "#dc2626" }}>{err}</p></div>;

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">All Admins</h1>
          <p className="page-subtitle">Manage admin accounts and their access</p>
        </div>
        <button className="btn-primary-cta green" onClick={() => setIsCreateOpen(true)}>
          + Create Admin
        </button>
      </div>

      {/* Filter bar */}
      <div className="toolbar-row">
        <span className="toolbar-label">Status:</span>
        <select className="toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="center">#</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Assigned Guest House</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="table-empty">No admins found</td></tr>
            ) : (
              filtered.map((user, i) => (
                <tr key={user._id}>
                  <td className="center">{i + 1}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "—"}</td>
                  <td>
                    {user.assignedGuestHouseId
                      ? <span className="badge ok">{user.assignedGuestHouseId.guestHouseName}</span>
                      : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? "ok" : "off"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-action edit"
                        onClick={() => { setSelectedUser(user); setIsEditOpen(true); }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-action toggle"
                        onClick={() => { setSelectedUser(user); setIsAssignOpen(true); }}
                      >
                        Assign GH
                      </button>
                      <button
                        className={`btn-action ${user.isActive ? "delete" : "approve"}`}
                        onClick={() => handleToggle(user)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-row">
        <button disabled={currentPage === 1}         onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
        <span className="pagination-info">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
      </div>

      {isEditOpen && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdate}
        />
      )}
      {isCreateOpen && (
        <CreateUserModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => { fetchUsers(currentPage); setIsCreateOpen(false); }}
        />
      )}
      {isAssignOpen && selectedUser && (
        <AssignGuestHouseModal
          user={selectedUser}
          onClose={() => { setIsAssignOpen(false); setSelectedUser(null); }}
          onSuccess={() => fetchUsers(currentPage)}
        />
      )}
    </div>
  );
};

export default UsersList;
