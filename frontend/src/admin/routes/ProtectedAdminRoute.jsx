import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({children}){
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if(!token || !user || user.role !== "admin"){
        return <Navigate to = "/signin"/>;
    }
    return children;
}