import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../../components/Navbar"
import GuestHouseCard from '../components/GuestHouseCard';
import Footer from "../../components/Footer";
import { logout } from "../../redux/authSlice";

export default function Dashboard() {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
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