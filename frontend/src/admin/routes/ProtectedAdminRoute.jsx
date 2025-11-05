import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({children}){
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    
    if(user.role === "admin"){
        return children;
    }else{
        return <Navigate to="/" /> 
    }

    // if(!token && user.role !== "admin"){
    //     return <Navigate to = "/signin"/>;
    // }
    // return children;

}