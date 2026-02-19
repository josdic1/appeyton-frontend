import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { ToastContext } from "../contexts/ToastContext";
import { api } from "../utils/api";
import { safe } from "../utils/safe";

export function NewReservationPage() {
  const { user } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.reservation;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);

  const [formData, setFormData] = useState({
    dining_room_id: "",
    reservation_time: new Date().toISOString().slice(0, 16),
    notes: "",
    attendees: [],
  });

  useEffect(() => {
    const hydrate = async () => {
      try {
        setLoading(true);
        const [roomRes, memberRes] = await Promise.all([
          api.get("/dining-rooms"),
          api.get("/members"),
        ]);
        setRooms(safe.array(roomRes.data?.data || roomRes.data));
        setMembers(safe.array(memberRes.data?.data || memberRes.data));

        if (editData) {
          setFormData({
            dining_room_id: editData.dining_room_id,
            reservation_time: new Date(editData.reservation_time)
              .toISOString()
              .slice(0, 16),
            notes: editData.notes || "",
            attendees: safe.array(editData.attendees),
          });
        } else if (user) {
          setFormData((prev) => ({
            ...prev,
            attendees: [
              {
                member_id: user.member_id || user.id,
                name: user.name,
                is_primary: true,
              },
            ],
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [user, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        dining_room_id: parseInt(formData.dining_room_id),
        reservation_time: new Date(formData.reservation_time).toISOString(),
        notes: formData.notes,
        attendees: formData.attendees.map((a) => ({
          member_id: a.member_id,
          name: a.name || "Guest",
          is_primary: !!a.is_primary,
        })),
      };

      if (editData) {
        await api.patch(`/reservations/${editData.id}`, payload);
      } else {
        await api.post("/reservations", payload);
      }

      addToast({
        status: "success",
        what: "Success",
        why: "Reservation saved.",
      });
      navigate("/reservations");
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 text-white rounded">
      <h1 className="text-xl font-bold mb-4">
        {editData ? "Edit" : "New"} Booking
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          className="w-full bg-slate-800 p-2 rounded"
          value={formData.dining_room_id}
          onChange={(e) =>
            setFormData({ ...formData, dining_room_id: e.target.value })
          }
        >
          <option value="">Select Room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="w-full bg-slate-800 p-2 rounded"
          value={formData.reservation_time}
          onChange={(e) =>
            setFormData({ ...formData, reservation_time: e.target.value })
          }
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-600 p-3 rounded font-bold"
        >
          {submitting ? "Saving..." : "Confirm"}
        </button>
      </form>
    </div>
  );
}
