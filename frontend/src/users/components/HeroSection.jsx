import React  from 'react';
import { FaHome } from 'react-icons/fa';
import '../styles/hero.css'
import { useNavigate } from 'react-router-dom';


const HeroSection = () => {

  const navigate = useNavigate();
  const user = localStorage.getItem('user');

  const navigateSignin = () => {
    if(user){
      navigate('/dashboard')
    }
    else{
      navigate('/signin')
    }
  }

  
  return (
    <div className="hero-container">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Your Home Away from Home</h1>
          <p className="hero-subtitle">Rishabh Guest House feels your Home</p>
          <button className="hero-button" onClick={navigateSignin}>Book Now</button>
        </div>
        <div className="hero-icon">
          <FaHome />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;