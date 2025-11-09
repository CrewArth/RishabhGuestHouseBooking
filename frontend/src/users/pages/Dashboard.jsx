import React, { use } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar"
import GuestHouseCard from '../components/GuestHouseCard';
import Footer from "../../components/Footer";

export default function Dashboard() {

    const navigate = useNavigate();

    //Get User Info
    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/signin");
    }

    return (
        <>
            <Navbar />

            <div className="dashboard-container">
                <GuestHouseCard />
            </div>

            <Footer />
        </>
    );
}