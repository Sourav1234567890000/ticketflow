import { useEffect, useState } from "react";
import { CalendarDays, ArrowRight } from "lucide-react";
import axios from "axios";

import EventCard from "../EventCard/EventCard";
import styles from "./EventSection.module.css";

const categories = [
    "All Events",
    "Music",
    "Sports",
    "Comedy",
    "Arts",
    "Technology",
];

function EventSection() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get("https://ticketflow-backend-lrnp.onrender.com/api/events");

                setEvents(response.data.data);

            } catch (err) {
                console.error("Failed to fetch events:", err);
                setError("Unable to load events. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <section className={styles.eventsSection} id="events">
            <div className={styles.sectionHeading}>
                <div>
                    <span className={styles.eyebrow}>DISCOVER</span>
                    <h2>Popular events</h2>
                </div>

                <a href="#events">
                    View all <ArrowRight size={16} />
                </a>
            </div>

            <div className={styles.categoryList}>
                {categories.map((category) => (
                    <button
                        key={category}
                        className={category === "All Events" ? styles.activeCategory : ""}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {loading && (
                <div className={styles.emptyEvents}>
                    <p>Loading events...</p>
                </div>
            )}

            {!loading && error && (
                <div className={styles.emptyEvents}>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && events.length === 0 && (
                <div className={styles.emptyEvents}>
                    <CalendarDays size={35} />
                    <h3>No events available</h3>
                    <p>Check back soon for upcoming experiences.</p>
                </div>
            )}

            {!loading && !error && events.length > 0 && (
                <div className={styles.eventGrid}>
                    {events.map((event) => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default EventSection;