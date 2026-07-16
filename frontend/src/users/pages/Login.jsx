import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import '../styles/login.css';
import api from "../../utils/api";
import { getAuthenticatedRedirectPath, getRedirectPathForRole } from "../../utils/auth";

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

  useEffect(() => {
    const redirectPath = getAuthenticatedRedirectPath();

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      const res = await api.post("/api/auth/signin", data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login Successful!", { autoClose: 1000 });

      setTimeout(() => {
        navigate(getRedirectPathForRole(res.data.user.role));
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
            <p className="footer-text">Need access? Contact a super admin.</p>
          </div>
        </div>
      </div>
    </>
  );
}
