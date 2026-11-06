    import Navbar from "../../components/layout/Navbar/Navbar";
import Hero from "../../components/home/Hero/Hero";
import EventSection from "../../components/home/EventSection/EventSection";

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EventSection />
      </main>
    </>
  );
}

export default Home;