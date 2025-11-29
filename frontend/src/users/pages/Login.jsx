import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../styles/login.css';

// Email Validation Schema
const schema = yup.object({
  email: yup.string().email("Invalid Email Format").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
}).required();


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      const res = await axios.post("http://localhost:5000/api/auth/signin", data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login Successful!", { autoClose: 1000 });

      setTimeout(() => {
        if (res.data.user.role === "admin") {
          navigate('/admin/dashboard');
        } else {
          navigate("/dashboard");
        }
      }, 1200);

    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed", { autoClose: 1000 });
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" theme="colored" />

      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your account</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                {...register("email")}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <div className="form-options">
              <div className="checkbox-group">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={() => setRememberMe(prev => !prev)}
                />
                <label htmlFor="rememberMe" className="checkbox-label">Remember me</label>
              </div>
              <button type="button" className="forgot-password-link" onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-button" disabled={!isValid || isSubmitting}>
              {isSubmitting ? <span className="spinner"></span> : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p className="footer-text">Don’t have an account?</p>
            <Link to="/signup" className="signup-button">Create Account</Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
