import { useState, useEffect, useMemo, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Search, Check, FileText, CheckCircle2, AlertCircle, WifiOff, Building2 } from "lucide-react";
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
import ConsentFormModal from "@/components/ConsentFormModal";
import { API_BASE } from "@/lib/config";
import {
  bookAppointmentWithOfflineSync,
  getCachedPatients,
  setCachedPatients,
  getCachedNurses,
  setCachedNurses,
  isDeviceOnline,
} from "@/lib/offlineSync";
import { Badge } from "@/components/ui/badge";

interface Patient {
  PatientID: number | string;
  PatientName: string;
  PatientSurname: string;
  DOB?: string;
  Patient_ContactNo?: string;
  _isOffline?: boolean;
}

interface Nurse {
  UserID: number;
  Name: string;
  Surname: string;
}

const BookAppointment = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [patients, setPatients] = useState<Patient[]>(() => getCachedPatients());
  const [nurses, setNurses] = useState<Nurse[]>(() => getCachedNurses());
  const [selectedNurse, setSelectedNurse] = useState<string>("");

  const [consentOpen, setConsentOpen] = useState(false);
  const [consentSignature, setConsentSignature] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const isOnline = isDeviceOnline();

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        if (isDeviceOnline()) {
          const [patientsRes, nursesRes] = await Promise.all([
            fetch(`${API_BASE}/patients`),
            fetch(`${API_BASE}/nurses`),
          ]);
          if (patientsRes.ok && nursesRes.ok) {
            const fetchedPatients = await patientsRes.json();
            const fetchedNurses = await nursesRes.json();

            // Merge with any cached offline patients that haven't synced yet
            const cached = getCachedPatients();
            const offlineOnly = cached.filter((p) => p._isOffline);
            const mergedPatients = [...offlineOnly, ...fetchedPatients];

            setPatients(mergedPatients);
            setCachedPatients(mergedPatients);

            setNurses(fetchedNurses);
            setCachedNurses(fetchedNurses);
            return;
          }
        }
      } catch (err) {
        console.warn("⚠️ Error fetching dropdown data, using offline cache:", err);
      }

      // Fallback
      setPatients(getCachedPatients());
      setNurses(getCachedNurses());
    };

    fetchDropdowns();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter((p) =>
      `${p.PatientName} ${p.PatientSurname}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const selectedPatientData = patients.find(
    (p) => p.PatientID?.toString() === selectedPatient
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedPatient || !appointmentDate || !appointmentTime || !selectedNurse) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!consentSignature) {
      toast.error("Patient consent form must be signed before booking");
      return;
    }

    try {
      setSubmitting(true);
      const localStart = new Date(`${appointmentDate}T${appointmentTime}:00`);

      const patName = selectedPatientData
        ? `${selectedPatientData.PatientName} ${selectedPatientData.PatientSurname}`
        : "Patient";

      const appointmentData = {
        PatientID: selectedPatient.startsWith("offline-")
          ? selectedPatient
          : parseInt(selectedPatient, 10),
        StartTime: localStart.toISOString(),
        EndTime: null,
        UserID: parseInt(selectedNurse, 10),
        ServiceName: "General Consultation",
        ServicePrice: null,
        PaymentMethod: null,
        IsStudent: false,
        Status: "Scheduled",
        Booking_Type: "Inclinic_Booking",
        MedicalAidNumber: null,
        MedicalAidName: null,
        MedicalAid_MainMember: null,
        MainMember__IDNo: null,
        MedicalAid_option: null,
        FinalPrice: null,
        patientName: patName,
        ConsentSignature: consentSignature,
      };

      const res = await bookAppointmentWithOfflineSync(appointmentData);

      if (res.offline) {
        toast.info(res.message, { duration: 5000 });
      } else {
        toast.success(res.message);
      }

      navigate("/bookings");
    } catch (err: any) {
      console.error("❌ Error booking appointment:", err);
      toast.error(err.message || "Error booking appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ConsentFormModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onAccept={(sig) => {
          setConsentSignature(sig);
          setConsentOpen(false);
          toast.success("Consent form signed successfully");
        }}
        patient={selectedPatientData || null}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold mb-2">Book Appointment</h1>
              {!isOnline && (
                <Badge variant="outline" className="border-amber-500/60 text-amber-400 bg-amber-950/30 gap-1 mb-2">
                  <WifiOff className="w-3 h-3" />
                  Offline Mode
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">
              Schedule a new patient appointment {(!isOnline) && "(will sync automatically once connected)"}
            </p>
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

                {/* Patient */}
                <div className="space-y-2">
                  <Label>Select Patient *</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-11"
                        data-testid="button-select-patient"
                      >
                        {selectedPatient
                          ? `${selectedPatientData?.PatientName} ${selectedPatientData?.PatientSurname}`
                          : "Search patient by surname..."}
                        <Search className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search by surname..."
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No patient found.</CommandEmpty>
                          <CommandGroup>
                            {filteredPatients.map((p) => (
                              <CommandItem
                                key={p.PatientID}
                                onSelect={() => {
                                  setSelectedPatient(p.PatientID.toString());
                                  setConsentSignature("");
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPatient === p.PatientID.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span>
                                  {p.PatientName} {p.PatientSurname}
                                </span>
                                {p._isOffline && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  >
                                    Offline
                                  </Badge>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Nurse / Doctor */}
                <div className="space-y-2">
                  <Label>Assign Nurse/Doctor *</Label>
                  <Select value={selectedNurse} onValueChange={setSelectedNurse}>
                    <SelectTrigger className="h-11" data-testid="select-nurse">
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
                      data-testid="input-appointment-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="h-11"
                      data-testid="input-appointment-time"
                    />
                  </div>
                </div>

                {/* Booking Type */}
                <div className="space-y-2">
                  <Label>Booking Type</Label>
                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border bg-muted/20">
                    <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">In-Clinic Booking</p>
                        <p className="text-xs text-muted-foreground">Standard physical clinic appointment</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-400 bg-cyan-950/30">
                        Inclinic_Booking
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Patient Consent Form */}
                <div className="space-y-2">
                  <Label>Patient Consent Form *</Label>
                  <div
                    className={cn(
                      "rounded-lg border-2 p-4 flex items-center justify-between",
                      consentSignature
                        ? "border-green-300 bg-green-50"
                        : "border-dashed border-muted-foreground/30 bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {consentSignature ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {consentSignature ? "Consent form signed" : "Consent form required"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {consentSignature
                            ? "Patient has reviewed and signed the consent form"
                            : "Patient must sign the consent form before booking"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={consentSignature ? "outline" : "default"}
                      size="sm"
                      className="gap-2 shrink-0"
                      disabled={!selectedPatient}
                      onClick={() => setConsentOpen(true)}
                      data-testid="button-open-consent"
                    >
                      <FileText className="h-4 w-4" />
                      {consentSignature ? "Re-sign" : "Open Form"}
                    </Button>
                  </div>
                  {!selectedPatient && (
                    <p className="text-xs text-muted-foreground">Select a patient first to open the consent form</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 h-11"
                    disabled={submitting}
                    data-testid="button-book-appointment"
                  >
                    {submitting
                      ? isOnline
                        ? "Booking..."
                        : "Saving Offline..."
                      : isOnline
                      ? "Book Appointment"
                      : "Save Appointment (Offline)"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 h-11"
                    disabled={submitting}
                  >
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
                <span className="text-muted-foreground">Date:</span>
                <span>{appointmentDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span>{appointmentTime || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Consent Form:</span>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    consentSignature
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {consentSignature ? "Signed" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Service, payment and billing details can be added after booking via All Bookings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BookAppointment;
