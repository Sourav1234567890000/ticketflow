import { MapPin, CalendarDays, ArrowUpRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./EventCard.module.css";

function EventCard({ event }) {
    const now = new Date();

    const salesOpenAt = new Date(event.salesOpenAt);
    const salesCloseAt = new Date(event.salesCloseAt);
    const eventDate = new Date(event.eventDate);

    const formatDateTime = (date) =>
        date.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

    let salesStatus = "Sales Not Open";

    if (event.status === "cancelled") {
        salesStatus = "Cancelled";
    } else if (event.status === "completed" || now >= eventDate) {
        salesStatus = "Event Completed";
    } else if (now < salesOpenAt) {
        salesStatus = "Sales Not Open";
    } else if (now >= salesCloseAt) {
        salesStatus = "Sales Closed";
    } else {
        salesStatus = "Sales Live";
    }

    const footerText = {
        "Sales Not Open": "Tickets coming soon",
        "Sales Live": "Tickets available",
        "Sales Closed": "Booking closed",
        Cancelled: "Event cancelled",
        "Event Completed": "Event completed",
    };

    return (
        <Link to={`/events/${event._id}`} className={styles.card}>
            <div className={styles.imageContainer}>
                <div className={styles.imagePlaceholder}>
                    <CalendarDays size={35} />
                </div>

                <span className={styles.status}>{salesStatus}</span>
            </div>

            <div className={styles.content}>
                <h3>{event.name}</h3>

                <div className={styles.eventInfo}>
                    <span>
                        <CalendarDays size={15} />
                        Event: {formatDateTime(eventDate)}
                    </span>

                    <span>
                        <MapPin size={15} />
                        {event.venue}
                    </span>

                    <span>
                        <Clock size={15} />
                        Sales open: {formatDateTime(salesOpenAt)}
                    </span>

                    <span>
                        <Clock size={15} />
                        Sales close: {formatDateTime(salesCloseAt)}
                    </span>
                </div>

                <div className={styles.cardFooter}>
                    <span>{footerText[salesStatus]}</span>

                    <button aria-label={`View ${event.name}`}>
                        <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>
        </Link>
    );
}

export default EventCard;