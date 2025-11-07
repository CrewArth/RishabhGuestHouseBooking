import React, { useEffect } from "react";
import "../styles/guestHouseCard.css";
import { FaMapMarkerAlt, FaTools } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchGuestHouses } from "../../redux/guestHouseSlice"; // <-- adjust relative path

const GuestHouseCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: guestHouses, loading, error } = useSelector(
    (state) => state.guestHouses
  );

  useEffect(() => {
    // Only fetch if not already loaded to avoid extra calls on remount
    if (!guestHouses || guestHouses.length === 0) {
      dispatch(fetchGuestHouses());
    }
  }, [dispatch]); // keep deps minimal to avoid loops

  const redirectBookingForm = (house) => {
    navigate("/booking", { state: { guestHouse: house } });
  };

  if (loading) return <p>Loading guest houses...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Error: {error}</p>;
  if (!guestHouses || guestHouses.length === 0) return <p>No guest houses found.</p>;

  return (
    <div className="guest-house-container">
      <div className="guest-house-grid">
        {guestHouses.map((house) => (
          <div key={house._id || house.guestHouseId} className="guest-house-card">
            <div className="card-image">
              <img
                src={house.image || "https://via.placeholder.com/600x360?text=Guest+House"}
                alt={house.guestHouseName}
              />
              {house.maintenance && (
                <div className="maintenance-badge">
                  <FaTools /> Under Maintenance
                </div>
              )}
            </div>

            <div className="card-content">
              <h3 className="house-name">{house.guestHouseName}</h3>
              <p className="location">
                <FaMapMarkerAlt />
                {house.location?.city}, {house.location?.state}
              </p>
              <p className="description">{house.description || "No description available."}</p>

              <button
                className={`book-button ${house.maintenance ? "disabled" : ""}`}
                disabled={house.maintenance}
                onClick={() => redirectBookingForm(house)}
              >
                {house.maintenance ? "Currently Unavailable" : "Book Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuestHouseCard;
