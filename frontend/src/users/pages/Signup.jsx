import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../styles/signup.css';

const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
  address: yup.string().required("Address is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
}).required();

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", data);
      toast.success("Account created successfully!", { autoClose: 1200 });

      setTimeout(() => {
        navigate("/signin");
      }, 1400);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed!", { autoClose: 1500 });
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" theme="colored" />

      <div className="signup-container">
        <div className="signup-wrapper">
          <div className="signup-header">
            <h1 className="signup-title">Create Account</h1>
            <p className="signup-subtitle">Join us today and get started</p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                  {...register("firstName")}
                />
                {errors.firstName && <p className="error-text">{errors.firstName.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                  {...register("lastName")}
                />
                {errors.lastName && <p className="error-text">{errors.lastName.message}</p>}
              </div>
            </div>

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
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                placeholder="1234567890"
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                {...register("phone")}
              />
              {errors.phone && <p className="error-text">{errors.phone.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                placeholder="123 Main Street"
                className={`form-input ${errors.address ? 'input-error' : ''}`}
                {...register("address")}
              />
              {errors.address && <p className="error-text">{errors.address.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a strong password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? <span className="spinner"></span> : "Register"}
            </button>
          </form>

          <div className="signup-footer">
            <p className="footer-text">Already have an account?</p>
            <Link to="/signin" className="login-button">Login</Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
