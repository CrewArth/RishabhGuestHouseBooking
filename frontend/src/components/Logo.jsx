import { useSelector } from 'react-redux';
import fallbackLogo from '../assets/logo.png';
import '../styles/navbar-logo.css';

const Logo = () => {
  const logoUrl = useSelector((state) => state.siteSettings.logoUrl);

  return (
    <div className='navbar-logo'>
      <a href="/">
        <img
          src={logoUrl || fallbackLogo}
          alt="Site Logo"
          id='nav-logo'
          draggable='false'
        />
      </a>
    </div>
  );
};

export default Logo;