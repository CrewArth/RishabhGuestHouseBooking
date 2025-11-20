import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../styles/login.css";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const tokenFromUrl = params.get("token");
  const emailFromUrl = params.get("email");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const missingParams = !tokenFromUrl || !emailFromUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (missingParams) {
      return toast.error("Reset link is invalid or missing parameters");
    }

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        token: tokenFromUrl,
        email: emailFromUrl,
        password: form.password,
      });
      toast.success("Password reset successfully");
      navigate("/signin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-header">
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">Enter a new password for your account.</p>
          </div>

          {missingParams ? (
            <div className="login-form">
              <p style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                This reset link is invalid or has expired. Please request a new password reset.
              </p>
              <Link to="/forgot-password" className="signup-button" style={{ textAlign: "center" }}>
                Request New Link
              </Link>
            </div>
          ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter new password"
                className="form-input"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                className="form-input"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Reset Password"}
            </button>
          </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResetPassword;

