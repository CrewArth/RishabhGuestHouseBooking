import React from "react";
import { Navigate, replace } from "react-router-dom";

function ProtectedRoute({children}){

    //Get the Token
    const token = localStorage.getItem('token'); 
    
    //If no Token -> Redirect to Signin
    if(!token){ 
        return <Navigate to="/signin" replace />;
    }else{
        return children;
    }
}

export default ProtectedRoute;