// EditUserModal.jsx
import React, { useState, useEffect } from "react";
import "../styles/editUserModel.css";

const EditUserModal = ({ user, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { ...form };
    delete updatedData.email; // prevent email update
    onSubmit(updatedData);
  };

  if (!user) return null;
  console.log(form);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Edit User</h2>
        <p className="subtitle">Editing: {user.email}</p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            First Name
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Last Name
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              disabled
              className="disabled-input"
            />
          </label>

          <label>
            Phone
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </label>

          <label>
            Address
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows="3"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active Account?
          </label>

          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn confirm">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
