// EditUserModal.jsx
import React, { useState, useEffect } from "react";
import "../styles/editUserModel.css";
import { toast } from "react-toastify";
import { readAndCompressImageAsDataUrl } from "../utils/imageUtils";

const EditUserModal = ({ user, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  });
  const [eSignatureFile, setESignatureFile] = useState(null);
  const [eSignaturePreview, setESignaturePreview] = useState("");

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
      setESignaturePreview(user.eSignatureUrl || "");
      setESignatureFile(null);
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
    const payload = new FormData();
    payload.append("firstName", form.firstName);
    payload.append("lastName", form.lastName);
    payload.append("phone", form.phone);
    payload.append("address", form.address);
    payload.append("isActive", String(form.isActive));

    if (eSignatureFile) {
      payload.append("eSignature", eSignatureFile);
    }

    onSubmit(payload);
  };

  const handleESignatureChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setESignatureFile(null);
      setESignaturePreview(user?.eSignatureUrl || "");
      return;
    }

    try {
      const preview = await readAndCompressImageAsDataUrl(file, {
        maxWidth: 640,
        maxHeight: 220,
        quality: 0.82,
      });
      setESignatureFile(file);
      setESignaturePreview(preview || "");
    } catch (error) {
      toast.error(error.message || "Unable to load ESignature preview.");
      event.target.value = "";
      setESignatureFile(null);
      setESignaturePreview(user?.eSignatureUrl || "");
    }
  };

  if (!user) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Edit Admin</h2>
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
            ESignature
            <input
              type="file"
              name="eSignature"
              accept="image/*"
              onChange={handleESignatureChange}
            />
          </label>
          {eSignaturePreview ? (
            <img
              src={eSignaturePreview}
              alt="ESignature preview"
              style={{ maxWidth: "100%", maxHeight: "90px", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px" }}
            />
          ) : null}

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
