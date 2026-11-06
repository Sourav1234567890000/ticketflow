import { Search, MapPin, CalendarDays } from "lucide-react";
import styles from "./Hero.module.css";

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}>
          YOUR NEXT EXPERIENCE STARTS HERE
        </span>

        <h1>
          Find your next
          <br />
          <span>unforgettable</span> event.
        </h1>

        <p>
          Discover concerts, sports, and experiences happening around you.
        </p>

        <div className={styles.searchBox}>
          <MapPin size={19} />
          <input placeholder="Location" />

          <CalendarDays size={19} />
          <input placeholder="Date" />

          <button>
            <Search size={18} />
            Search
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;