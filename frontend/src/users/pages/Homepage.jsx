import Navbar from '../../components/Navbar';
import HeroSection from '../components/HeroSection';
import GuestHouseCard from '../components/GuestHouseCard';
import Footer from '../../components/Footer'


export default function Homepage() {
  return (
    <>
    <Navbar/>
    <HeroSection />
    <GuestHouseCard showOnlyThree={true} />
    

    <Footer />
    </>
  );
}
