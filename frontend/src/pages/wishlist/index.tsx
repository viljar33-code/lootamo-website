import Navbar from "@/components/Navbar";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import WishList from "@/components/WishList";

export default function Wishlist() {
    return (
    <>
    <Topbar />
          <Navbar />
          <WishList/>   
          <Footer/> 
    </>
    );
}