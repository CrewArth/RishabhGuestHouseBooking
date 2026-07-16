// CreateUserModal.jsx
import React, { useState } from "react";
import "../styles/editUserModel.css";
import { toast } from "react-toastify";
import api from "../../utils/api";

const CreateUserModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post("/api/admin/users", form);

      toast.success(res.data.message || "Admin created successfully!");
      onSuccess(); // Refresh users list
      onClose(); // Close modal
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to create user. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Create New Admin</h2>
        <p className="subtitle">
          Set the password here. The account will be created with this password.
        </p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            First Name *
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </label>

          <label>
            Last Name *
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </label>

          <label>
            Email *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </label>

          <label>
            Phone *
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              pattern="[0-9]*"
              title="Please enter numbers only"
            />
          </label>

          <label>
            Address
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows="3"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Password *
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              minLength="6"
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn confirm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;

