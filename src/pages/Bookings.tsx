// src/pages/Bookings.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, WifiOff, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE } from "@/lib/config";
import {
  getCachedBookings,
  setCachedBookings,
  isDeviceOnline,
  getOfflineQueue,
} from "@/lib/offlineSync";

interface Booking {
  id: number | string;
  patientName: string;
  ServiceName: string;
  Booking_Type?: string | null;
  StartTime: string | null;
  EndTime: string | null;
  Status: string | null;
  isFollow_Up: string | null;
  UserID?: number | null;
  _isOffline?: boolean;
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>(() => getCachedBookings());
  const [loading, setLoading] = useState(bookings.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(!isDeviceOnline());
  const navigate = useNavigate();

  // =====================
  // FETCH BOOKINGS
  // =====================
  const fetchBookings = async () => {
    const queue = getOfflineQueue();
    const offlinePendingIds = new Set(
      queue.filter((q) => q.type === "ADD_APPOINTMENT").map((q) => q.tempId)
    );

    try {
      setLoading(true);
      setError(null);

      if (isDeviceOnline()) {
        const res = await axios.get<Booking[]>(
          `${API_BASE}/bookings`,
          { timeout: 7000 }
        );

        if (Array.isArray(res.data)) {
          const cached = getCachedBookings();
          const pendingOffline = cached.filter(
            (b) => b._isOffline && offlinePendingIds.has(b.id)
          );

          const combined = [...pendingOffline, ...res.data];
          setBookings(combined);
          setCachedBookings(combined);
          setIsOfflineMode(false);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("❌ Network error fetching live bookings, loading from cache:", err);
    }

    const cached = getCachedBookings();
    setBookings(cached);
    setIsOfflineMode(!isDeviceOnline());
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    const handleSync = () => fetchBookings();
    const handleUpdate = () => fetchBookings();
    const handleOnline = () => {
      setIsOfflineMode(false);
      fetchBookings();
    };
    const handleOffline = () => setIsOfflineMode(true);

    window.addEventListener("dunwell_data_synced", handleSync);
    window.addEventListener("dunwell_data_updated", handleUpdate);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("dunwell_data_synced", handleSync);
      window.removeEventListener("dunwell_data_updated", handleUpdate);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // =====================
  // HELPERS
  // =====================
  const formatTime = (value: string | null) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================
  // DELETE BOOKING
  // =====================
  const deleteBooking = async (id: number | string) => {
    if (typeof id === "string" && id.startsWith("offline-")) {
      const updated = bookings.filter((b) => b.id !== id);
      setBookings(updated);
      setCachedBookings(updated);
      toast.success("Offline booking removed from device");
      return;
    }

    if (!isDeviceOnline()) {
      toast.error("Deleting existing database bookings requires an internet connection.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this booking?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);

      await axios.delete(
        `${API_BASE}/appointments/${id}`
      );

      toast.success("Booking deleted successfully");
      fetchBookings();
    } catch (err) {
      console.error("❌ Error deleting booking:", err);
      toast.error("Failed to delete booking.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-lg border rounded-2xl">
        <CardHeader className="flex flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">All Bookings</CardTitle>
              {isOfflineMode && (
                <Badge variant="outline" className="border-amber-500/60 text-amber-400 bg-amber-950/30 gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline Cache
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              Showing all appointments scheduled for today
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/appointments/book")}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Book New
            </Button>

            <Button
              variant="outline"
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No appointments found for today.
            </p>
          ) : (
            <Table>
              <TableCaption>
                List of today's scheduled appointments
              </TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Booking Type</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow Up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {bookings.map((b) => (
                  <TableRow
                    key={b.id}
                    className={
                      b._isOffline ? "bg-amber-950/10 border-l-2 border-l-amber-500" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {b.patientName}
                      {b._isOffline && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 gap-1 inline-flex items-center"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          Pending Sync
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-cyan-500/40 text-cyan-300 bg-cyan-950/20 whitespace-nowrap"
                      >
                        {b.Booking_Type || "Inclinic_Booking"}
                      </Badge>
                    </TableCell>
                    <TableCell>{b.ServiceName}</TableCell>
                    <TableCell>{formatTime(b.StartTime)}</TableCell>
                    <TableCell>{formatTime(b.EndTime)}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          b._isOffline
                            ? "outline"
                            : b.Status === "Scheduled"
                            ? "default"
                            : b.Status === "Completed"
                            ? "secondary"
                            : b.Status === "Cancelled"
                            ? "destructive"
                            : "outline"
                        }
                        className={b._isOffline ? "border-amber-400 text-amber-300" : ""}
                      >
                        {b._isOffline ? "Saved Offline" : (b.Status ?? "Unknown")}
                      </Badge>
                    </TableCell>

                    <TableCell>{b.isFollow_Up ?? "No"}</TableCell>

                    <TableCell className="flex gap-2">
                      {!b._isOffline && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/edit-appointment/${b.id}`)
                          }
                        >
                          Edit
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteBooking(b.id)}
                        disabled={deletingId === b.id}
                      >
                        {deletingId === b.id ? "Deleting..." : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
