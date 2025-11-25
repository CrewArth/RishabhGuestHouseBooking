import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/profile.css'
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const Profile = () => {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            alert("User not logged in");
            navigate("/signin");
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setUpdatedUser(userData);
    }, [navigate]);

    const handleInputChange = (e) => {
        setUpdatedUser({
            ...updatedUser,
            [e.target.name]: e.target.value,
        });
    };

    const handleUpdate = async () => {
        try {
            const response = await axios.put(`http://localhost:5000/api/users/${user._id}`, updatedUser);

            // Check if we have a valid response with user data
            if (response.data && response.data.user) {
                const updatedData = response.data.user;

                // Update localStorage and state
                localStorage.setItem("user", JSON.stringify(updatedData));
                setUser(updatedData);
                setIsEditing(false);

                // Show success message and navigate
                toast.success("Profile updated successfully")
                navigate('/dashboard');
            } else {
                console.error("Invalid response structure:", response.data);
                throw new Error("Unexpected response format from server");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            // alert(error.response?.data?.message || "Failed to update profile. Please try again.");
            toast.error(error.response?.data?.message || "Failed to update profile. Please try again.")
        }
    }
    if (!user) return null;

    return (
        <div className="profile-page-container">
            <div className='navbar'>
                <Navbar />
            </div>
            {/* <button onClick={() => navigate(-1)} className="btn btn-back">← Back</button> */}
            <div className="profile-card">
                <h1 className="profile-title">My Profile</h1>

                {
                    isEditing ? (
                        <div className="profile-edit-form">
                            <div className="profile-row">
                                <label>First Name:</label>
                                <input type="text" name="firstName" value={updatedUser.firstName} onChange={handleInputChange} />
                            </div>

                            <div className="profile-row">
                                <label>Last Name:</label>
                                <input type="text" name="lastName" value={updatedUser.lastName} onChange={handleInputChange} />
                            </div>

                            <div className="profile-row">
                                <label>Email:</label>
                                <input type="email" name="email" value={updatedUser.email} onChange={handleInputChange} disabled />
                            </div>

                            <div className="profile-row">
                                <label>Phone:</label>
                                <input type="tel" name="phone" value={updatedUser.phone} onChange={handleInputChange} />
                            </div>

                            <div className="profile-row">
                                <label>Address:</label>
                                <textarea name="address" value={updatedUser.address || ""} onChange={handleInputChange}></textarea>
                            </div>

                            <div className="profile-buttons">
                                <button onClick={() => setIsEditing(false)} className="profile-btn profile-btn-cancel">Cancel</button>
                                <button onClick={handleUpdate} className="profile-btn profile-btn-update">Save Changes</button>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-info">
                            <div className="profile-row">
                                <span className="profile-label">First Name:</span>
                                <span className="profile-value">{user.firstName}</span>
                            </div>

                            <div className="profile-row">
                                <span className="profile-label">Last Name:</span>
                                <span className="profile-value">{user.lastName}</span>
                            </div>

                            <div className="profile-row">
                                <span className="profile-label">Email:</span>
                                <span className="profile-value">{user.email}</span>
                            </div>

                            <div className="profile-row">
                                <span className="profile-label">Phone:</span>
                                <span className="profile-value">{user.phone}</span>
                            </div>

                            <div className="profile-row">
                                <span className="profile-label">Address:</span>
                                <span className="profile-value">{user.address || "N/A"}</span>
                            </div>

                            <div className="profile-row">
                                <span className="profile-label">Account Status:</span>
                                <span className={`profile-value status ${user.isActive ? "active" : "inactive"}`}>
                                    {user.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="profile-buttons">
                                <button onClick={() => navigate(-1)} className="profile-btn profile-btn-back">
                                    ← Back
                                </button>
                                <button onClick={() => setIsEditing(true)} className="profile-btn profile-btn-edit">
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default Profile