import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axios from "axios";
import "../styles/myBooking.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    } else {
      setError("User not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/bookings/my?userId=${user._id}`
        );
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?._id]);

  if (loading)
    return (
      <>
        <Navbar />
        <div className="page-content my-bookings-container">
          Loading your bookings...
        </div>
        <Footer />
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <div className="page-content my-bookings-container error">
          {error}
        </div>
        <Footer />
      </>
    );

  return (
    <>
      <Navbar />
      <div className="page-content my-bookings-container">
        <h2>My Bookings</h2>

        {bookings.length === 0 ? (
          <p className="no-bookings">No bookings found.</p>
        ) : (
          <table className="my-bookings-table">
            <thead>
              <tr>
                <th>Guest House</th>
                <th>Room</th>
                <th>Bed</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.guestHouseId?.guestHouseName || "—"}</td>
                  <td>
                    {b.roomId?.roomNumber
                      ? `Room ${b.roomId.roomNumber}`
                      : "—"}
                  </td>
                  <td>
                    {b.bedId?.bedNumber
                      ? `Bed ${b.bedId.bedNumber} (${b.bedId.bedType})`
                      : "—"}
                  </td>
                  <td>{new Date(b.checkIn).toLocaleDateString("en-IN")}</td>
                  <td>{new Date(b.checkOut).toLocaleDateString("en-IN")}</td>
                  <td>
                    <span className={`status ${b.status}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyBookings;
