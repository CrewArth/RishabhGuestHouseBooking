import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import HeroSection from '../components/HeroSection';
import GuestHouseCard from '../components/GuestHouseCard';
import Footer from '../../components/Footer'


export default function Homepage() {
  return (
    <>
    <Navbar/>
    <HeroSection />
    <div className="container mx-auto px-4 py-8 mt-4">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Featured Guest House</h1>
    </div>
    <GuestHouseCard />
    

    <Footer />
    </>
  );
}
