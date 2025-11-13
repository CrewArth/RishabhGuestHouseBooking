import axios from "axios";
import { useEffect, useState } from "react";
import '../styles/usersList.css';
import EditUserModal from "../components/EditUserModel";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setErr(null);

      const res = await axios.get(`http://localhost:5000/api/admin/users?page=${page}&limit=${limit}`);

      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
      setTotalUsers(res.data.totalUsers || 0);
    } catch (e) {
      console.error("Error fetching users: ", e);
      setErr("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  //Soft Delete User
  const handleSoftDeleteUser = async (userId) => {
    if (!window.confirm("Deactivate this user? They won't be able to log in.")) return;

    try {
      await axios.patch(`http://localhost:5000/api/users/${userId}/deactivate`);
      fetchUsers(); // refresh UI
    } catch (error) {
      console.error("Error toggling user active state:", error);
      alert("Failed to update user status");
    }
  };


  // Update user information
  const handleUpdateUser = async (updatedUser) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${selectedUser._id}`, updatedUser);
      alert("User updated successfully");
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

    // ✅ Trigger re-fetch when currentPage changes
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  if (loading)
    return <div className="users-wrap admin-content"><p>Loading Users...</p></div>;

  if (err)
    return <div className="users-wrap admin-content"><p className="error">{err}</p></div>;

  return (
    <div className="admin-content">
      <div className="users-header">
        <h1>All Users</h1>
        <span className="count">Total: {users.length}</span>
      </div>

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Status</th>
              {/* <th>Date Joined</th> */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.isActive ? "ok" : "off"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* <td>{formatDate(user.createdAt)}</td> */}

                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleSoftDeleteUser(user._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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

      {isEditModalOpen && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default UsersList;