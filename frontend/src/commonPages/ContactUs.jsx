import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import './commonPages.css';

const ContactUs = () => {
  return (
    <div className="common-page-container">
      <Navbar />
      <div className="common-page-content">
        <div className="common-page-header">
          <h1>Contact Us</h1>
          <p>Get in touch with us - We're here to help</p>
        </div>

        <div className="common-section">
          <h2>Connect With Us</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <h3><FaPhone style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />Phone Numbers</h3>
              <p><strong>US Toll Free:</strong> 1-877-RISHABH</p>
              <p><strong>USA:</strong> +1-201-484-7302</p>
              <p><strong>INDIA:</strong> +91 8511122697</p>
              <p><strong>UK:</strong> +44 2070318422</p>
              <p><strong>AU:</strong> +61 2 8311 1544</p>
            </div>

            <div className="contact-card">
              <h3><FaEnvelope style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />Email</h3>
              <p>
                <a href="mailto:sales@rishabhsoft.com">sales@rishabhsoft.com</a>
              </p>
            </div>
          </div>
        </div>

        <div className="common-section">
          <h2>Our Locations</h2>
          
          <div className="location-grid">
            <div className="location-card">
              <h4>
                <FaMapMarkerAlt style={{ color: 'var(--accent)' }} />
                Vadodara - HQ
              </h4>
              <p>Plot 66, Beside Sigil India, Padra Road, Atladra, Vadodara – 390012, Gujarat</p>
              <p><strong>Phone:</strong> +91-85111 22697</p>
            </div>

            <div className="location-card">
              <h4>
                <FaMapMarkerAlt style={{ color: 'var(--accent)' }} />
                Ahmedabad
              </h4>
              <p>Devx, 4th floor Binori B Square3, Sindhu Bhavan Road, Ahmedabad – 380054, Gujarat</p>
            </div>

            <div className="location-card">
              <h4>
                <FaMapMarkerAlt style={{ color: 'var(--accent)' }} />
                Pune
              </h4>
              <p>Supreme Headquarters Premises Co-operative Society, Office No. 501 & 709, Baner, Pune – 411045, Maharashtra</p>
            </div>

            <div className="location-card">
              <h4>
                <FaMapMarkerAlt style={{ color: 'var(--accent)' }} />
                Hyderabad
              </h4>
              <p>215, Cyber Crown, Sec-ll village, HUDA Techno Enclave, Madhapur, Hyderabad – 500081, Telangana</p>
            </div>

            <div className="location-card">
              <h4>
                <FaMapMarkerAlt style={{ color: 'var(--accent)' }} />
                Bengaluru
              </h4>
              <p>Workafella Co-working #150/1, Infantry Road, Opp. to Commissioner Office, Vasanth Nagar, Bengaluru – 560001, Karnataka</p>
            </div>
          </div>
        </div>

        <div className="highlight-box">
          <h3>International Offices</h3>
          <p>We also have a strong presence in the <strong>United States</strong>, <strong>United Kingdom</strong>, and <strong>Australia</strong> to serve our global clients better.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;

