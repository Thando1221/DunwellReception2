import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, Plus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

// ── AddServiceRow — unified Auto + Manual service picker ──────────────────────
function AddServiceRow({ services, addedServices, onAdd }) {
  const [mode, setMode] = useState("auto");
  const [catalogueValue, setCatalogueValue] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const availableCatalogue = services.filter(
    (s) => !addedServices.some((a) => a.name === s.Name && a.source === "auto")
  );

  const handleAdd = () => {
    if (mode === "auto") {
      if (!catalogueValue) return;
      const svc = services.find((s) => s.Name === catalogueValue);
      if (!svc) return;
      onAdd({ name: svc.Name, price: String(svc.Price || 0), source: "auto", discount: svc.discount });
      setCatalogueValue("");
    } else {
      if (!manualName.trim()) return;
      onAdd({ name: manualName.trim(), price: manualPrice || "0", source: "manual" });
      setManualName("");
      setManualPrice("");
    }
  };

  const canAdd = mode === "auto" ? !!catalogueValue : !!manualName.trim();

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3 space-y-2.5">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {["auto", "manual"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              mode === m
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "auto" ? "From Catalogue" : "Manual Entry"}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-center">
        {mode === "auto" ? (
          <Select value={catalogueValue} onValueChange={setCatalogueValue}>
            <SelectTrigger className="h-10 flex-1">
              <SelectValue placeholder="Choose a service from catalogue..." />
            </SelectTrigger>
            <SelectContent>
              {availableCatalogue.length === 0 ? (
                <SelectItem value="_none" disabled>All catalogue services added</SelectItem>
              ) : (
                availableCatalogue.map((s) => (
                  <SelectItem key={s.CatalougeID ?? s.Name} value={s.Name}>
                    {s.Name} — R{parseFloat(s.Price || 0).toFixed(2)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Service name..."
              className="h-10 flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            />
            {/* R prefix price box */}
            <div className="flex items-center h-10 rounded-md border border-input bg-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background overflow-hidden w-32">
              <span className="px-2.5 text-sm font-semibold text-foreground bg-muted h-full flex items-center border-r border-input select-none">
                R
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                className="flex-1 h-full bg-transparent text-sm px-2 outline-none"
                placeholder="0.00"
              />
            </div>
          </>
        )}
        <Button
          type="button"
          className="h-10 shrink-0 gap-1.5 px-4"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

export default function EditAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  // dropdown data
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [nurses, setNurses] = useState([]);

  // form values
  const [selectedPatient, setSelectedPatient] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isStudent, setIsStudent] = useState(false);

  // Unified added services list: { name, price, source: "auto"|"manual", discount? }
  const [addedServices, setAddedServices] = useState([]);

  const [medicalAidNumber, setMedicalAidNumber] = useState("");
  const [medicalAidOption, setMedicalAidOption] = useState("");
  const [mainMemberIdNo, setMainMemberIdNo] = useState("");
  const [medicalAidMainMember, setMedicalAidMainMember] = useState("");
  const [medicalAidName, setMedicalAidName] = useState("");

  const [selectedNurse, setSelectedNurse] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingRaw, setBookingRaw] = useState(null);

  // Fetch dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [patientsRes, catalogueRes, nursesRes] = await Promise.all([
          fetch(`${API_BASE}/patients`),
          fetch(`${API_BASE}/catalogue`),
          fetch(`${API_BASE}/nurses`),
        ]);
        if (!patientsRes.ok || !catalogueRes.ok || !nursesRes.ok)
          throw new Error("Failed to fetch dropdown data");
        setPatients(await patientsRes.json());
        setServices(await catalogueRes.json());
        setNurses(await nursesRes.json());
      } catch (err) {
        console.error("❌ Error fetching dropdown data:", err);
        toast.error("Error loading dropdown data");
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch booking
  useEffect(() => {
    if (!appointmentId) return;
    const loadBooking = async () => {
      try {
        const res = await fetch(`${API_BASE}/bookings/${appointmentId}`);
        if (!res.ok) throw new Error("Failed to fetch booking");
        const data = await res.json();
        setBookingRaw(data);
        mapBookingToForm(data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error loading booking:", err);
        toast.error("Failed to load appointment");
        setLoading(false);
      }
    };
    loadBooking();
  }, [appointmentId]);

  const mapBookingToForm = (data) => {
    if (data.PatientID) setSelectedPatient(String(data.PatientID));
    if (data.UserID) setSelectedNurse(String(data.UserID));
    if (data.PaymentMethod) setPaymentMethod(data.PaymentMethod.toLowerCase());
    setIsStudent(Boolean(data.IsStudent));

    setMedicalAidName(data.MedicalAidName || "");
    setMedicalAidNumber(data.MedicalAidNumber || "");
    setMedicalAidOption(data.MedicalAid_option || "");
    setMedicalAidMainMember(data.MedicalAid_MainMember || "");
    setMainMemberIdNo(data.MainMember__IDNo || "");

    const rawStart = data.StartTime || "";
    if (rawStart) {
      const normalized = rawStart.replace(" ", "T").replace("Z", "");
      const [d, t] = normalized.split("T");
      setAppointmentDate(d ?? "");
      setAppointmentTime((t ?? "").slice(0, 5));
    }

    // Pre-fill service if it exists
    if (data.ServiceName) {
      setAddedServices([
        { name: data.ServiceName, price: data.ServicePrice ? String(data.ServicePrice) : "0", source: "manual" },
      ]);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter((p) =>
      p.PatientSurname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const selectedPatientData = patients.find(
    (p) => p.PatientID?.toString() === selectedPatient
  );

  // ── Service helpers ────────────────────────────────────────────────────────
  const removeAddedService = (idx) =>
    setAddedServices((prev) => prev.filter((_, i) => i !== idx));

  // Build combined service name + price from addedServices
  const computedService = useMemo(() => {
    if (addedServices.length === 0) return { name: "", price: 0, finalPrice: 0 };
    const name = addedServices.map((s) => s.name).join(" + ");
    const price = addedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    const finalPrice = isStudent
      ? addedServices.reduce((sum, s) => {
          if (s.source === "auto" && s.discount && parseFloat(s.discount) > 0) {
            return sum + parseFloat(s.discount);
          }
          return sum + (parseFloat(s.price) || 0);
        }, 0)
      : price;
    return { name, price, finalPrice };
  }, [addedServices, isStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient || !appointmentDate || !appointmentTime || !selectedNurse) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "medical-aid") {
      if (!medicalAidNumber || !medicalAidOption || !mainMemberIdNo || !medicalAidMainMember || !medicalAidName) {
        toast.error("Please fill in all medical aid fields");
        return;
      }
    }

    const payload = {
      StartTime: `${appointmentDate}T${appointmentTime}`,
      EndTime: null,
      UserID: parseInt(selectedNurse),
      ServiceName: computedService.name || null,
      ServicePrice: computedService.price || null,
      FinalPrice: computedService.finalPrice || null,
      PaymentMethod: paymentMethod.toUpperCase(),
      IsStudent: isStudent,
      Status: bookingRaw?.Status || "InPatient",
      MedicalAidNumber: paymentMethod === "medical-aid" ? medicalAidNumber : null,
      MedicalAidName:
        paymentMethod === "medical-aid"
          ? medicalAidName
          : paymentMethod === "cash"
          ? "Cash"
          : paymentMethod === "card"
          ? "Card"
          : null,
      MedicalAid_MainMember: paymentMethod === "medical-aid" ? medicalAidMainMember : null,
      MainMember__IDNo: paymentMethod === "medical-aid" ? mainMemberIdNo : null,
      MedicalAid_option: paymentMethod === "medical-aid" ? medicalAidOption : null,
      isFollow_Up: bookingRaw?.isFollow_Up ?? false,
    };

    try {
      const res = await fetch(`${API_BASE}/bookings/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Update failed:", text);
        throw new Error("Failed to update appointment");
      }

      toast.success("Appointment updated!");
      navigate("/bookings");
    } catch (err) {
      console.error("❌ Error updating appointment:", err);
      toast.error("Error updating appointment");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/bookings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold mb-2">Edit Appointment</h1>
          <p className="text-muted-foreground text-lg">Modify existing appointment details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
            <CardDescription>Fill in all required fields below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Patient — read-only */}
              <div className="space-y-2">
                <Label>Patient</Label>
                <Popover open={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-11"
                      disabled
                    >
                      {selectedPatientData
                        ? `${selectedPatientData.PatientName} ${selectedPatientData.PatientSurname}`
                        : "Patient not found"}
                      <Search className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Patient cannot be changed while editing — create a new appointment to change.
                </p>
              </div>

              {/* Nurse / Doctor */}
              <div className="space-y-2">
                <Label>Assign Nurse/Doctor *</Label>
                <Select value={selectedNurse} onValueChange={setSelectedNurse}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select nurse/doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {nurses.map((n) => (
                      <SelectItem key={n.UserID} value={n.UserID.toString()}>
                        {n.Name} {n.Surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* ── Service Section ───────────────────────────────────────── */}
              <div className="space-y-3">
                <Label>Services</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Add one or more services — choose from the catalogue or enter manually. Services are combined automatically.
                </p>

                {/* Unified add-service row */}
                <AddServiceRow
                  services={services}
                  addedServices={addedServices}
                  onAdd={(svc) => setAddedServices((prev) => [...prev, svc])}
                />

                {/* Added services list */}
                {addedServices.length > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {addedServices.map((svc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2.5 text-sm bg-background border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide",
                              svc.source === "auto"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {svc.source === "auto" ? "Catalogue" : "Manual"}
                          </span>
                          <span className="truncate text-foreground">{svc.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 pl-2">
                          <span className="font-semibold text-primary">
                            R{parseFloat(svc.price || 0).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAddedService(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Total row */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 border-t border-border">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Total
                      </span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-bold text-primary">
                          R{computedService.finalPrice.toFixed(2)}
                        </span>
                        {isStudent && computedService.finalPrice < computedService.price && (
                          <span className="text-[10px] text-green-600 font-medium">
                            Student discount applied (was R{computedService.price.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Student */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isStudent"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isStudent">
                  Wits / University Student (eligible for discount)
                </Label>
              </div>

              {/* Payment */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card Payment</SelectItem>
                    <SelectItem value="medical-aid">Medical Aid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Medical Aid */}
              {paymentMethod === "medical-aid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Medical Aid Name *</Label>
                    <Input
                      value={medicalAidName}
                      onChange={(e) => setMedicalAidName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Aid Number *</Label>
                    <Input
                      value={medicalAidNumber}
                      onChange={(e) => setMedicalAidNumber(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Aid Option *</Label>
                    <Input
                      value={medicalAidOption}
                      onChange={(e) => setMedicalAidOption(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Main Member Name *</Label>
                    <Input
                      value={medicalAidMainMember}
                      onChange={(e) => setMedicalAidMainMember(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Main Member ID Number *</Label>
                    <Input
                      value={mainMemberIdNo}
                      onChange={(e) => setMainMemberIdNo(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 h-11">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => navigate("/bookings")} className="flex-1 h-11">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="shadow-md h-fit">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient:</span>
              <span>
                {selectedPatientData
                  ? `${selectedPatientData.PatientName} ${selectedPatientData.PatientSurname}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nurse/Doctor:</span>
              <span>
                {selectedNurse
                  ? `${nurses.find((n) => n.UserID.toString() === selectedNurse)?.Name} ${nurses.find((n) => n.UserID.toString() === selectedNurse)?.Surname}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="text-right max-w-[60%]">
                {computedService.name || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span>{isStudent ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="capitalize">
                {paymentMethod ? paymentMethod.replace("-", " ") : "—"}
              </span>
            </div>
            {computedService.finalPrice > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    R{computedService.finalPrice.toFixed(2)}
                  </span>
                </div>
                {isStudent && computedService.finalPrice < computedService.price && (
                  <p className="text-xs text-green-600 pt-1">Student discount applied</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
