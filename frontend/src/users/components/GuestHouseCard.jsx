import React from "react";
import "../styles/guestHouseCard.css";
import { FaMapMarkerAlt, FaTools } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const GuestHouseCard = () => {
  const guestHouseData = [
    {
      guestHouseName: "Rishabh Residency",
      location: { city: "Ahmedabad", state: "Gujarat" },
      image:
        "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=800",
      description:
        "A cozy guest house located near the city center with modern amenities and peaceful surroundings.",
      maintenance: false,
    },
    {
      guestHouseName: "Rishabh View Stay",
      location: { city: "Manali", state: "Himachal Pradesh" },
      image:
        "https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&w=800",
      description:
        "Experience breathtaking mountain views and homely comfort at our beautiful hillside guest house.",
      maintenance: true,
    },
    {
      guestHouseName: "Rishabh Comfort Inn",
      location: { city: "Goa", state: "Goa" },
      image:
        "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800",
      description:
        "A beachside retreat perfect for vacations and weekend getaways with easy beach access.",
      maintenance: false,
    },
    {
      guestHouseName: "Rishabh Heritage Guest House",
      location: { city: "Jaipur", state: "Rajasthan" },
      image:
        "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800",
      description:
        "A royal-themed guest house offering traditional Rajasthani hospitality in the heart of Jaipur.",
      maintenance: false,
    },
    {
      guestHouseName: "Rishabh Valley Stay",
      location: { city: "Munnar", state: "Kerala" },
      image:
        "https://images.pexels.com/photos/235725/pexels-photo-235725.jpeg?auto=compress&cs=tinysrgb&w=800",
      description:
        "Nestled amidst tea gardens, this guest house provides a peaceful environment and scenic views.",
      maintenance: true,
    },
  ];

  // Replace Navigate import with useNavigate
  const navigate = useNavigate();

  const redirectBookingForm = (house) => {
    try {
      // Create a clean object with only the data we need
      const guestHouseData = {
        name: house.guestHouseName,
        location: {
          city: house.location.city,
          state: house.location.state
        },
        image: house.image,
        description: house.description
      };

      // Navigate with the clean data object
      navigate('/booking', { 
        state: { 
          guestHouse: guestHouseData
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  return (
    <div className="guest-house-container">
      <div className="guest-house-grid">
        {guestHouseData.map((house, index) => (
          <div key={index} className="guest-house-card">
            <div className="card-image">
              <img src={house.image} alt={house.guestHouseName} />
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
                {house.location.city}, {house.location.state}
              </p>
              <p className="description">{house.description}</p>

              <div className="book-ghouse">

              <button
                className={`book-button ${
                  house.maintenance ? "disabled" : ""
                }`}
                disabled={house.maintenance}
                onClick={(e) => {
                  e.preventDefault();
                  redirectBookingForm(house);
                }}
              > 
                {house.maintenance
                  ? "Currently Unavailable"
                  : "Book Now"}
              </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuestHouseCard;
