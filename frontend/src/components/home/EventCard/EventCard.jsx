import { MapPin, CalendarDays, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./EventCard.module.css";

function EventCard({ event }) {
    const eventDate = new Date(event.eventDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <Link to={`/events/${event._id}`} className={styles.card}>
            <div className={styles.imageContainer}>
                <div className={styles.imagePlaceholder}>
                    <CalendarDays size={35} />
                </div>
                <span className={styles.status}>{event.status}</span>
            </div>

            <div className={styles.content}>
                <h3>{event.name}</h3>

                <div className={styles.eventInfo}>
                    <span>
                        <CalendarDays size={15} />
                        {eventDate}
                    </span>

                    <span>
                        <MapPin size={15} />
                        {event.venue}
                    </span>
                </div>

                <div className={styles.cardFooter}>
                    <span>Tickets available</span>
                    <button aria-label={`View ${event.name}`}>
                        <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>
        </Link>
    );
}

export default EventCard;