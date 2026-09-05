// Mock data based on the SQL Server database schema

export interface Patient {
  PatientID: number;
  PatientName: string;
  PatientSurname: string;
  Patient_ContactNo: string;
  Patient_Email: string;
  DOB: string;
  Address: string;
  CreatedDate: string;
  Gender: string;
}

export interface Appointment {
  AppointID: number;
  PatientID: number;
  MedicalAidNumber: string | null;
  StartTime: string;
  EndTime: string;
  UserID: number;
  MedicalAidName: string | null;
  Status: string;
  ServiceName: string;
  ServicePrice: number;
  MedicalAid_MainMember: string | null;
  MainMember__IDNo: string | null;
  MedicalAid_option: string | null;
  PaymentMethod: string;
  FinalPrice: number;
  IsStudent: boolean;
  isFollow_Up: boolean;
}

export interface CatalogueItem {
  CatalougeID: number;
  Type: string;
  Name: string;
  Price: number;
  discount: number;
}

export interface RegisterEntry {
  RegisterID: number;
  UserID: number;
  Date: string;
  TimeIn: string;
  TimeOut: string;
  OnLeave: boolean;
  remark_OnArrival: string;
  HoursWorked: number;
}

export interface User {
  UserID: number;
  Name: string;
  Surname: string;
}

// Generate mock data
const firstNames = ["Thabo", "Naledi", "Sipho", "Zanele", "Kagiso", "Lerato", "Bongani", "Nomsa", "Tshepo", "Palesa", "Mandla", "Ayanda", "Lebo", "Khanyi", "Mpho", "Sizwe", "Dineo", "Thabiso", "Lindiwe", "Jabu"];
const lastNames = ["Molefe", "Nkosi", "Dlamini", "Zulu", "Mkhize", "Ndlovu", "Mokoena", "Khumalo", "Cele", "Maseko", "Sithole", "Ngcobo", "Mthembu", "Shabalala", "Mahlangu", "Radebe", "Pillay", "Govender", "Botha", "Van Wyk"];
const services = ["Consultation", "HIV Testing", "TB Screening", "Family Planning", "Mental Health", "STI Treatment", "Vaccination", "Blood Pressure Check", "Diabetes Screening", "Dental Checkup"];
const paymentMethods = ["Cash", "Credit Card", "Medical Aid"];
const medicalAids = ["Discovery Health", "Bonitas", "Medihelp", "Momentum Health", "GEMS", "Bestmed", "Fedhealth", "Sizwe Medical Fund", null, null];
const statuses = ["Completed", "Completed", "Completed", "Cancelled", "No Show"];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Seed for consistency
let seed = 42;
function seededRandom() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function seededChoice<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function seededInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function seededDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()));
}

// Generate patients
export const patients: Patient[] = Array.from({ length: 120 }, (_, i) => {
  const gender = seededRandom() > 0.45 ? "Female" : "Male";
  const name = seededChoice(firstNames);
  const surname = seededChoice(lastNames);
  const dob = seededDate(new Date(1985, 0, 1), new Date(2006, 11, 31));
  const created = seededDate(new Date(2024, 0, 1), new Date(2026, 11, 31));
  return {
    PatientID: i + 1,
    PatientName: name,
    PatientSurname: surname,
    Patient_ContactNo: `07${seededInt(10, 99)}${seededInt(100, 999)}${seededInt(1000, 9999)}`,
    Patient_Email: `${name.toLowerCase()}.${surname.toLowerCase()}@email.com`,
    DOB: dob.toISOString().split('T')[0],
    Address: `${seededInt(1, 200)} ${seededChoice(["Main", "Church", "Long", "Voortrekker", "Jan Smuts"])} Street, Johannesburg`,
    CreatedDate: created.toISOString().split('T')[0],
    Gender: gender,
  };
});

// Generate catalogue
export const catalogue: CatalogueItem[] = services.map((name, i) => ({
  CatalougeID: i + 1,
  Type: i < 3 ? "Primary Care" : i < 6 ? "Specialist" : "General",
  Name: name,
  Price: seededInt(150, 800),
  discount: seededRandom() > 0.7 ? seededInt(5, 20) : 0,
}));

// Generate users (employees)
export const users: User[] = [
  { UserID: 1, Name: "Dr. Thandi", Surname: "Mabaso" },
  { UserID: 2, Name: "Nurse Precious", Surname: "Ndaba" },
  { UserID: 3, Name: "Dr. James", Surname: "Pillay" },
  { UserID: 4, Name: "Sister Grace", Surname: "Mokoena" },
  { UserID: 5, Name: "Dr. Sarah", Surname: "Botha" },
];

// Generate appointments
export const appointments: Appointment[] = Array.from({ length: 450 }, (_, i) => {
  const service = seededChoice(catalogue);
  const payMethod = seededChoice(paymentMethods);
  const medAid = payMethod === "Medical Aid" ? seededChoice(medicalAids.filter(Boolean)) : null;
  const startTime = seededDate(new Date(2024, 0, 1), new Date(2026, 11, 31));
  const endTime = new Date(startTime.getTime() + seededInt(15, 60) * 60000);
  const isStudent = seededRandom() > 0.7;
  const price = service.Price;
  const discount = service.discount;
  const finalPrice = price - (price * discount / 100);

  return {
    AppointID: i + 1,
    PatientID: seededInt(1, 120),
    MedicalAidNumber: medAid ? `MA${seededInt(100000, 999999)}` : null,
    StartTime: startTime.toISOString(),
    EndTime: endTime.toISOString(),
    UserID: seededInt(1, 5),
    MedicalAidName: medAid,
    Status: seededChoice(statuses),
    ServiceName: service.Name,
    ServicePrice: price,
    MedicalAid_MainMember: medAid ? seededChoice(firstNames) + " " + seededChoice(lastNames) : null,
    MainMember__IDNo: medAid ? `${seededInt(8000, 9912)}${seededInt(10, 28)}${seededInt(1000, 9999)}${seededInt(100, 199)}` : null,
    MedicalAid_option: medAid ? seededChoice(["Essential", "Classic", "Premium", "Smart"]) : null,
    PaymentMethod: payMethod,
    FinalPrice: finalPrice,
    IsStudent: isStudent,
    isFollow_Up: seededRandom() > 0.75,
  };
});

// Generate register entries
export const registerEntries: RegisterEntry[] = [];
for (let userId = 1; userId <= 5; userId++) {
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2026, 11, 31);
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getDay() !== 0) { // Not Sunday
      const onLeave = seededRandom() > 0.88;
      const hoursWorked = onLeave ? 0 : seededInt(6, 10);
      registerEntries.push({
        RegisterID: registerEntries.length + 1,
        UserID: userId,
        Date: current.toISOString().split('T')[0],
        TimeIn: onLeave ? "" : `0${seededInt(7, 8)}:${seededInt(0, 5)}0`,
        TimeOut: onLeave ? "" : `${seededInt(15, 18)}:${seededInt(0, 5)}0`,
        OnLeave: onLeave,
        remark_OnArrival: onLeave ? "On Leave" : seededChoice(["On time", "On time", "Late", "On time", "Early"]),
        HoursWorked: hoursWorked,
      });
    }
    current.setDate(current.getDate() + 1);
  }
}

// Helper: filter by date range
export type TimeRange = "weekly" | "monthly" | "quarterly" | "semi-quarterly" | "yearly" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(type: TimeRange, referenceDate: Date = new Date(), selectedMonth?: number, customRange?: DateRange): DateRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (type) {
    case "weekly": {
      const m = selectedMonth !== undefined ? selectedMonth : month;
      const weekStart = new Date(year, m, 1);
      const weekEnd = new Date(year, m + 1, 0);
      return { start: weekStart, end: weekEnd };
    }
    case "monthly":
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
    case "quarterly": {
      const q = Math.floor(month / 3);
      return { start: new Date(year, q * 3, 1), end: new Date(year, q * 3 + 3, 0) };
    }
    case "semi-quarterly": {
      const half = month < 6 ? 0 : 6;
      return { start: new Date(year, half, 1), end: new Date(year, half + 6, 0) };
    }
    case "yearly":
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    case "custom":
      return customRange || { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
    default:
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
  }
}

export function filterByDateRange<T extends Record<string, any>>(data: T[], dateField: string, range: DateRange): T[] {
  return data.filter(item => {
    const d = new Date(item[dateField]);
    return d >= range.start && d <= range.end;
  });
}
