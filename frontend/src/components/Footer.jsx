import React from 'react'
import Logo from './Logo'
import '../styles/footer.css';
import { Navigate, useNavigate } from 'react-router-dom';

const Footer = () => {

  const navigate = useNavigate();

  return (
    <div>
        <div className="footer-container">
        <div className="company">
            <Logo />
            <p>Rishabh Software</p>
        </div>
        <div className="contactus">
            <ul>
                <li>About Us</li>
                <li>Contact Us</li>
                <li>Terms & Policy</li>
                <li>FAQ</li>
            </ul>
        </div>

        </div>
    </div>
  )
}

export default Footer