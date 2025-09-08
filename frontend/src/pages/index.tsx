// pages/index.tsx
import Topbar from "@/components/Topbar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HeroCard from "@/components/HeroCard";
import ChoosePlatform from "@/components/ChoosePlatform";

export default function Home() {
  return (
    <>
      <Topbar />
      <Navbar />
      <Hero />
      <HeroCard/>
      <ChoosePlatform/>
      <Footer />
    </>
  );
}
