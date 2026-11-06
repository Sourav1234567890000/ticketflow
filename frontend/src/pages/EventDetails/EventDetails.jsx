import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
    CalendarDays,
    MapPin,
    Ticket,
    Users,
    IndianRupee,
    Clock,
    CheckCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar/Navbar";
import styles from "./EventDetails.module.css";

const API_URL = "https://ticketflow-backend-lrnp.onrender.com/api";

function EventDetails() {
    const { eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [maxPrice, setMaxPrice] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch event and seat details
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const eventResponse = await axios.get(
                    `${API_URL}/events/${eventId}`
                );

                setEvent(eventResponse.data.data);

                const seatsResponse = await axios.get(
                    `${API_URL}/customer/events/${eventId}/seats`
                );

                const seatsData =
                    seatsResponse.data.data || seatsResponse.data.seats || [];

                // Group seats by section and price
                const groupedSections = Object.values(
                    seatsData.reduce((groups, seat) => {
                        const key = `${seat.section}-${seat.price}`;

                        if (!groups[key]) {
                            groups[key] = {
                                section: seat.section,
                                price: seat.price,
                                availableCount: 0,
                            };
                        }

                        groups[key].availableCount += 1;

                        return groups;
                    }, {})
                );

                setSections(groupedSections);

                if (groupedSections.length > 0) {
                    setSelectedSection(groupedSections[0].section);
                    setMaxPrice(groupedSections[0].price);
                }
            } catch (err) {
                console.error("Failed to load event:", err);
                console.error("Failed URL:", err.config?.url);
                console.error("Response:", err.response?.data);

                setError("Unable to load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [eventId]);

    // Format date and time in IST
    const formatDateTime = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Calculate sales status
    const getSalesStatus = () => {
        if (!event) return "Loading";

        const salesOpenAt = new Date(event.salesOpenAt);
        const salesCloseAt = new Date(event.salesCloseAt);
        const eventDate = new Date(event.eventDate);

        if (event.status === "cancelled") {
            return "Cancelled";
        }

        if (event.status === "completed" || currentTime >= eventDate) {
            return "Event Completed";
        }

        if (currentTime < salesOpenAt) {
            return "Sales Not Open";
        }

        if (currentTime >= salesCloseAt) {
            return "Sales Closed";
        }

        return "Sales Live";
    };

    const salesStatus = getSalesStatus();
    const canBook = salesStatus === "Sales Live";

    // Handle section selection
    const handleSectionChange = (section) => {
        setSelectedSection(section.section);
        setMaxPrice(section.price);
    };

    // Handle booking preference submission
    const handleBookingRequest = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!canBook) {
            setError("Ticket sales are currently closed.");
            return;
        }

        if (!customerName.trim() || !customerEmail.trim()) {
            setError("Please enter your name and email.");
            return;
        }

        if (!selectedSection || !maxPrice) {
            setError("Please select a ticket section.");
            return;
        }

        const selected = sections.find(
            (section) => section.section === selectedSection
        );

        if (!selected || quantity > selected.availableCount) {
            setError("The selected quantity is not available in this section.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.post(`${API_URL}/customer/bookings`, {
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim(),
                eventId,
                preferredSection: selectedSection,
                quantity: Number(quantity),
                maxPrice: Number(maxPrice),
            });

            setSuccess(
                response.data.message ||
                "Your booking preferences have been saved."
            );
        } catch (err) {
            console.error("Booking request failed:", err);

            setError(
                err.response?.data?.message ||
                "Unable to save your booking preferences."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className={styles.page}>
                    <p className={styles.message}>
                        Loading event details...
                    </p>
                </main>
            </>
        );
    }

    if (error && !event) {
        return (
            <>
                <Navbar />
                <main className={styles.page}>
                    <p className={styles.error}>{error}</p>
                </main>
            </>
        );
    }

    if (!event) return null;

    const selectedSectionData = sections.find(
        (section) => section.section === selectedSection
    );

    const statusMessages = {
        "Sales Not Open": `Booking opens on ${formatDateTime(event.salesOpenAt)}`,
        "Sales Live": "You can save your booking preferences now.",
        "Sales Closed": "Ticket sales have ended. Booking is no longer available.",
        "Event Completed": "This event has already taken place.",
        Cancelled: "This event has been cancelled.",
    };

    return (
        <>
            <Navbar />

            <main className={styles.page}>
                {/* Event Header */}
                <section className={styles.eventHeader}>
                    <div className={styles.eventBanner}>
                        <span className={styles.status}>
                            {salesStatus}
                        </span>

                        <Ticket size={65} strokeWidth={1.2} />

                        <h1>{event.name}</h1>

                        <p>Book your experience with TicketFlow</p>
                    </div>

                    {/* Event Information */}
                    <div className={styles.eventInfo}>
                        <div className={styles.infoItem}>
                            <CalendarDays />
                            <div>
                                <span>Event date & time</span>
                                <strong>
                                    {formatDateTime(event.eventDate)}
                                </strong>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <MapPin />
                            <div>
                                <span>Venue</span>
                                <strong>{event.venue}</strong>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <Clock />
                            <div>
                                <span>Ticket sales open</span>
                                <strong>
                                    {formatDateTime(event.salesOpenAt)}
                                </strong>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <Clock />
                            <div>
                                <span>Ticket sales close</span>
                                <strong>
                                    {formatDateTime(event.salesCloseAt)}
                                </strong>
                            </div>
                        </div>

                        {/* Sales Status Banner */}
                        <div className={styles.salesBanner}>
                            <strong>{salesStatus}</strong>
                            <p>{statusMessages[salesStatus]}</p>
                        </div>
                    </div>
                </section>

                {/* Booking Layout */}
                <section className={styles.bookingLayout}>
                    {/* Available Sections */}
                    <div className={styles.sectionPanel}>
                        <div className={styles.heading}>
                            <span>01</span>
                            <div>
                                <h2>Choose your section</h2>
                                <p>
                                    Select your preferred seating category.
                                </p>
                            </div>
                        </div>

                        {sections.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Ticket size={35} />
                                <h3>No seats available</h3>
                                <p>
                                    There are currently no available seats
                                    for this event.
                                </p>
                            </div>
                        ) : (
                            <div className={styles.sectionGrid}>
                                {sections.map((section) => (
                                    <button
                                        type="button"
                                        key={`${section.section}-${section.price}`}
                                        onClick={() =>
                                            handleSectionChange(section)
                                        }
                                        className={`${styles.sectionCard} ${
                                            selectedSection === section.section
                                                ? styles.selectedSection
                                                : ""
                                        }`}
                                    >
                                        <span>{section.section}</span>
                                        <strong>₹{section.price}</strong>
                                        <small>
                                            {section.availableCount} seats
                                            available
                                        </small>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Booking Preferences */}
                    <form
                        className={styles.bookingPanel}
                        onSubmit={handleBookingRequest}
                    >
                        <div className={styles.heading}>
                            <span>02</span>
                            <div>
                                <h2>Booking preferences</h2>
                                <p>Tell us what tickets you want.</p>
                            </div>
                        </div>

                        <label>
                            Full name
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) =>
                                    setCustomerName(e.target.value)
                                }
                                placeholder="Enter your name"
                                required
                            />
                        </label>

                        <label>
                            Email address
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) =>
                                    setCustomerEmail(e.target.value)
                                }
                                placeholder="Enter your email"
                                required
                            />
                        </label>

                        <label>
                            Preferred section
                            <select
                                value={selectedSection}
                                onChange={(e) => {
                                    const section = sections.find(
                                        (item) =>
                                            item.section === e.target.value
                                    );

                                    if (section) {
                                        handleSectionChange(section);
                                    }
                                }}
                                required
                                disabled={
                                    sections.length === 0 || !canBook
                                }
                            >
                                {sections.map((section) => (
                                    <option
                                        key={`${section.section}-${section.price}`}
                                        value={section.section}
                                    >
                                        {section.section} - ₹{section.price}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Number of tickets
                            <select
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(Number(e.target.value))
                                }
                                disabled={!canBook}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                                    .filter(
                                        (number) =>
                                            number <=
                                            (selectedSectionData?.availableCount || 0)
                                    )
                                    .map((number) => (
                                        <option key={number} value={number}>
                                            {number}{" "}
                                            {number === 1
                                                ? "ticket"
                                                : "tickets"}
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <label>
                            Maximum price per ticket (₹)
                            <input
                                type="number"
                                min="0"
                                value={maxPrice}
                                onChange={(e) =>
                                    setMaxPrice(e.target.value)
                                }
                                required
                                disabled={!canBook}
                            />
                        </label>

                        {/* Price Summary */}
                        <div className={styles.priceSummary}>
                            <span>
                                <Users size={17} />
                                Tickets requested
                            </span>

                            <strong>{quantity}</strong>

                            <span>
                                <IndianRupee size={17} />
                                Maximum total budget
                            </span>

                            <strong>
                                ₹{Number(maxPrice || 0) * quantity}
                            </strong>
                        </div>

                        {error && (
                            <p className={styles.error}>{error}</p>
                        )}

                        {success && (
                            <p className={styles.success}>
                                <CheckCircle size={18} />
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={
                                submitting ||
                                sections.length === 0 ||
                                !canBook
                            }
                        >
                            {submitting
                                ? "Saving preferences..."
                                : !canBook
                                    ? salesStatus
                                    : "Save booking preferences"}
                        </button>

                        <p className={styles.disclaimer}>
                            This saves your preferences. It does not book or
                            reserve seats immediately.
                        </p>
                    </form>
                </section>
            </main>
        </>
    );
}

export default EventDetails;