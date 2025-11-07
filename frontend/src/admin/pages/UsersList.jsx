import axios from "axios";
import { useEffect, useState } from "react";
import '../styles/usersList.css';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setErr(null);

            const res = await axios.get('http://localhost:5000/api/admin/users');

            setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
        } catch (e) {
            console.error('Error fetching users: ', e);
            setErr('Failed to load users')
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await axios.delete(`http://localhost:5000/api/users/${userId}`);
            alert("User deleted sucessfully");
            fetchUsers(); //refreshes list
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user");
        }
    }
    useEffect(() => { fetchUsers(); }, []);

    if (loading) return <div className="users-wrap"><p>Loading Users...</p></div>;

    if (err) return <div className="users-wrap"><p className="error">{err}</p></div>
    console.log(users);

    return (
        <div className="users-wrap">
            <div className="users-header">
                <h1>All Users</h1>
                <span className="count">Total: {users.length}</span>
            </div>

            <div className="users-table-wrap">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.isActive ? "Active" : "Inactive"}</td>
                                <td>
                                    <button
                                        onClick={() => handleDeleteUser(user._id)}
                                        className="delete-btn"
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        ))}
                        {users.length === 0 && (<tr><td colSpan="3" style={{ textAlign: 'center' }}>No users found</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default UsersList;