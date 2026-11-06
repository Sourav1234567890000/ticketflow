import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>
        ticket<span>flow.</span>
      </div>

      <nav className={styles.navLinks}>
        <Link to="/">Explore</Link>
        <Link to="/events">Events</Link>
        <Link to="/bookings">My Bookings</Link>
      </nav>

      <button className={styles.loginBtn}>Sign In</button>
    </header>
  );
}

export default Navbar;