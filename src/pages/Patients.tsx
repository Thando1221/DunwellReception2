import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Pencil, Trash2, Plus, WifiOff, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_BASE } from "@/lib/config";
import {
  getCachedPatients,
  setCachedPatients,
  isDeviceOnline,
  getOfflineQueue,
} from "@/lib/offlineSync";
import { Badge } from "@/components/ui/badge";

const Patients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<any[]>(() => getCachedPatients());
  const [loading, setLoading] = useState(patients.length === 0);
  const [isOfflineMode, setIsOfflineMode] = useState(!isDeviceOnline());

  const fetchPatients = async () => {
    const queue = getOfflineQueue();
    const offlinePendingIds = new Set(
      queue.filter((q) => q.type === "ADD_PATIENT").map((q) => q.tempId)
    );

    try {
      if (isDeviceOnline()) {
        const res = await axios.get(`${API_BASE}/patients`, { timeout: 7000 });
        if (Array.isArray(res.data)) {
          const cached = getCachedPatients();
          const pendingOffline = cached.filter(
            (p) => p._isOffline && offlinePendingIds.has(p.PatientID)
          );

          const combined = [...pendingOffline, ...res.data];
          setPatients(combined);
          setCachedPatients(combined);
          setIsOfflineMode(false);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch live patients, using cache:", err);
    }

    const cached = getCachedPatients();
    setPatients(cached);
    setIsOfflineMode(!isDeviceOnline());
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();

    const handleSync = () => fetchPatients();
    const handleUpdate = () => fetchPatients();
    const handleOnline = () => {
      setIsOfflineMode(false);
      fetchPatients();
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

  const handleDelete = async (id: any) => {
    if (typeof id === "string" && id.startsWith("offline-")) {
      const updated = patients.filter((p) => p.PatientID !== id);
      setPatients(updated);
      setCachedPatients(updated);
      toast.success("Offline patient removed from device");
      return;
    }

    if (!isDeviceOnline()) {
      toast.error("Deleting existing database records requires an internet connection.");
      return;
    }

    if (!confirm("Are you sure you want to remove this patient?")) return;

    try {
      await axios.delete(`${API_BASE}/patients/${id}`);
      toast.success("Patient deleted successfully");
      fetchPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete patient");
    }
  };

  const filteredPatients = patients.filter((p: any) =>
    `${p.PatientName} ${p.PatientSurname}`.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">Patients</h1>
            {isOfflineMode && (
              <Badge variant="outline" className="border-amber-500/60 text-amber-400 bg-amber-950/30 gap-1">
                <WifiOff className="w-3 h-3" />
                Offline Cache
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            Manage and update patient records efficiently
          </p>
        </div>

        <Button onClick={() => navigate("/patients/add")} className="h-11 gap-2">
          <Plus className="w-5 h-5" />
          Add Patient
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or surname…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <Button variant="outline" size="icon" className="h-11 w-11">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Surname</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-center">Status / Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading patients…
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((p: any) => (
                    <TableRow
                      key={p.PatientID}
                      className={`hover:bg-accent ${
                        p._isOffline ? "bg-amber-950/10 border-l-2 border-l-amber-500" : ""
                      }`}
                    >
                      <TableCell className="font-mono text-xs">
                        {p._isOffline ? (
                          <span className="text-amber-400">Offline</span>
                        ) : (
                          p.PatientID
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.PatientName}
                        {p._isOffline && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 gap-1 inline-flex items-center"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            Pending Sync
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{p.PatientSurname}</TableCell>
                      <TableCell>{p.Patient_ContactNo}</TableCell>
                      <TableCell>{p.Patient_Email}</TableCell>
                      <TableCell>{p.DOB?.split("T")[0] || "—"}</TableCell>
                      <TableCell>{p.Gender}</TableCell>

                      <TableCell className="text-center flex gap-2 justify-center">
                        {!p._isOffline && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/patients/edit/${p.PatientID}`)}
                            title="Edit patient"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(p.PatientID)}
                          title="Delete patient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;
