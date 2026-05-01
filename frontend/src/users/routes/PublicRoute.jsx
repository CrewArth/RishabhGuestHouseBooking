import React from "react";
import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
    // Get the Token
    const token = localStorage.getItem('token');
    
    // If user is logged in, redirect based on role
    if (token) {
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : {};
            
            // Redirect admin users to admin dashboard
            if (user.role === 'admin') {
                return <Navigate to="/admin/dashboard" replace />;
            }
            
            // Redirect regular users to user dashboard
            return <Navigate to="/dashboard" replace />;
        } catch (error) {
            // If user data is corrupted, clear it and allow access
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return children;
        }
    }
    
    // If no token, allow access to public pages (login/register)
    return children;
}

export default PublicRoute;

