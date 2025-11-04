import logo from '../assets/logo.png';
import '../styles/navbar-logo.css';

const Logo = () => {
  
  return (
    <div className='navbar-logo'>
      <a href="/">
        <img src={logo} alt="Rishabh Software Logo" id='nav-logo'/>
      </a>
    </div>
  )
}

export default Logo