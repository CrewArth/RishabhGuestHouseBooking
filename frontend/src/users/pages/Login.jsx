import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import '../styles/login.css'


// ✅ Define validation schema
const schema = yup.object({
  email: yup
    .string()
    .email("Invalid Email Format")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
}).required();

export default function LoginPage() {

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  //React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange", // triggers validation in real-time
  });

  //Remember Me
  const [rememberMe, setRememberMe] = useState(false);

  //Load saved Email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
      setRememberMe(true);
    }
  }, [setValue])

  //Form submission handler
  const onSubmit = async (data) => {
    try {
      // Save Email if Remeber me is Checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      const res = await axios.post("http://localhost:5000/api/auth/signin", data);

      // Save JWT token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Navigate to homepage
      if (res.data.user.role === "admin") {
        navigate('/admin/dashboard');
      } else {
        navigate("/dashboard");
      }


    } catch (error) {
      if (error.response?.data) {
        alert(error.response.data.message); // e.g., Invalid Credentials
      } else {
        alert("Something went wrong");
        console.error(error);
      }
    }
  };

  const handleForgotPassword = () => {
    console.log("Redirecting to forgot password page");
    navigate("/forgot-password");
  };

  return (

    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {/* Use handleSubmit from React Hook Form */}
        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="form-input"
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
                className="form-input"
                {...register("password")}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
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
              />
              <label htmlFor="rememberMe" className="checkbox-label">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p className="footer-text">Don’t have an account?</p>
          <Link to="/signup" className="signup-button">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
