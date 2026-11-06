import { useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  MapPin,
  Ticket,
  Pencil,
  X,
  Save,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar/Navbar";
import styles from "./Bookings.module.css";

const API_URL = "http://localhost:5000/api";

function Bookings() {
  const [email, setEmail] = useState(
    localStorage.getItem("customerEmail") || ""
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingBooking, setEditingBooking] = useState(null);
  const [form, setForm] = useState({
    preferredSection: "",
    quantity: 1,
    maxPrice: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchBookings = async () => {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/customer/bookings/${encodeURIComponent(email.trim())}`
      );

      setBookings(response.data.data || []);
      localStorage.setItem("customerEmail", email.trim());
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError(
        err.response?.data?.message || "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email.trim()) {
      fetchBookings();
    }
  }, []);

  const openEditForm = (booking) => {
    setEditingBooking(booking);

    setForm({
      preferredSection: booking.preferredSection || "",
      quantity: booking.quantity || 1,
      maxPrice: booking.maxPrice || "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await axios.patch(
        `${API_URL}/customer/bookings/${editingBooking._id}`,
        {
          customerEmail: email.trim(),
          preferredSection: form.preferredSection,
          quantity: Number(form.quantity),
          maxPrice: Number(form.maxPrice),
        }
      );

      setEditingBooking(null);
      await fetchBookings();
    } catch (err) {
      console.error("Failed to update booking:", err);
      setError(
        err.response?.data?.message || "Unable to update booking preferences."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>YOUR ACCOUNT</span>
              <h1>My Bookings</h1>
              <p>View and manage your saved ticket preferences.</p>
            </div>
          </div>

          <form
            className={styles.emailForm}
            onSubmit={(e) => {
              e.preventDefault();
              fetchBookings();
            }}
          >
            <input
              type="email"
              placeholder="Enter your booking email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Find bookings"}
            </button>
          </form>

          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <div className={styles.empty}>Loading your bookings...</div>
          ) : bookings.length === 0 ? (
            <div className={styles.empty}>
              <Ticket size={36} />
              <h3>No bookings found</h3>
              <p>Your saved booking preferences will appear here.</p>
            </div>
          ) : (
            <div className={styles.bookingList}>
              {bookings.map((booking) => (
                <article className={styles.bookingCard} key={booking._id}>
                  <div className={styles.cardTop}>
                    <div>
                      <span className={styles.bookingLabel}>
                        BOOKING REQUEST
                      </span>
                      <h2>{booking.event?.name || "Event"}</h2>
                    </div>

                    <span
                      className={`${styles.status} ${
                        styles[booking.status]
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className={styles.eventDetails}>
                    <span>
                      <MapPin size={16} />
                      {booking.event?.venue || "Venue unavailable"}
                    </span>

                    <span>
                      <CalendarDays size={16} />
                      {formatDate(booking.event?.eventDate)}
                    </span>
                  </div>

                  <div className={styles.preferenceGrid}>
                    <div>
                      <span>Preferred section</span>
                      <strong>{booking.preferredSection}</strong>
                    </div>

                    <div>
                      <span>Tickets</span>
                      <strong>{booking.quantity}</strong>
                    </div>

                    <div>
                      <span>Maximum price / ticket</span>
                      <strong>
                        ₹{Number(booking.maxPrice).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  {booking.status === "pending" && (
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditForm(booking)}
                      >
                        <Pencil size={15} />
                        Edit preferences
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {editingBooking && (
        <div
          className={styles.modalOverlay}
          onClick={() => setEditingBooking(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2>Edit preferences</h2>
                <p>{editingBooking.event?.name}</p>
              </div>

              <button
                className={styles.closeButton}
                onClick={() => setEditingBooking(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <label>
                Preferred section
                <input
                  type="text"
                  value={form.preferredSection}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferredSection: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Number of tickets
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Maximum price per ticket (₹)
                <input
                  type="number"
                  min="1"
                  value={form.maxPrice}
                  onChange={(e) =>
                    setForm({ ...form, maxPrice: e.target.value })
                  }
                  required
                />
              </label>

              <button
                type="submit"
                className={styles.saveButton}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Bookings;