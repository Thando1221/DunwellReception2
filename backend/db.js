import sql from "mssql";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or backend directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "false" ? false : true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true" ? true : false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  // Set sufficient connection and request timeouts for Azure SQL cloud latency (30s)
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000", 10),
  requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || "30000", 10),
};

// ==========================================
// In-Memory Mock Store (Dunwell Clinic)
// ==========================================
const mockData = {
  users: [
    {
      UserID: 1,
      UserName: "admin",
      Password: "password123",
      Name: "Admin",
      Surname: "Receptionist",
      Email: "reception@dunwellclinic.co.za",
      ContactNo: "0112345678",
      DOB: "1990-01-01",
      UserRole: "R",
      SANC_HPCSA: "REC-001",
    },
    {
      UserID: 2,
      UserName: "receptionist",
      Password: "password123",
      Name: "Nomsa",
      Surname: "Dlamini",
      Email: "nomsa@dunwellclinic.co.za",
      ContactNo: "0823456789",
      DOB: "1994-05-12",
      UserRole: "R",
      SANC_HPCSA: "REC-002",
    },
    {
      UserID: 3,
      UserName: "nurse_thando",
      Password: "password123",
      Name: "Sister Thando",
      Surname: "Gumbi",
      Email: "thando@dunwellclinic.co.za",
      ContactNo: "0712345678",
      DOB: "1988-08-20",
      UserRole: "N",
      SANC_HPCSA: "SANC-4421",
    },
    {
      UserID: 4,
      UserName: "nurse_lerato",
      Password: "password123",
      Name: "Sister Lerato",
      Surname: "Khumalo",
      Email: "lerato@dunwellclinic.co.za",
      ContactNo: "0832345678",
      DOB: "1992-11-15",
      UserRole: "N",
      SANC_HPCSA: "SANC-7789",
    },
    {
      UserID: 5,
      UserName: "dr_mthembu",
      Password: "password123",
      Name: "Dr. Sipho",
      Surname: "Mthembu",
      Email: "dr.mthembu@dunwellclinic.co.za",
      ContactNo: "0829876543",
      DOB: "1984-03-22",
      UserRole: "D",
      SANC_HPCSA: "HPCSA-9012",
    },
  ],

  patients: [
    {
      PatientID: 1,
      PatientName: "Nandi",
      PatientSurname: "Mabaso",
      Patient_ContactNo: "0721234567",
      Patient_Email: "nandi.mabaso@gmail.com",
      DOB: "1998-04-12",
      Address: "124 Hospital Road, Braamfontein",
      Gender: "Female",
      CreatedDate: new Date(),
    },
    {
      PatientID: 2,
      PatientName: "Kagiso",
      PatientSurname: "Ndlovu",
      Patient_ContactNo: "0832345678",
      Patient_Email: "k.ndlovu@yahoo.com",
      DOB: "2001-11-03",
      Address: "45 Main Street, Soweto",
      Gender: "Male",
      CreatedDate: new Date(),
    },
    {
      PatientID: 3,
      PatientName: "Zandile",
      PatientSurname: "Zulu",
      Patient_ContactNo: "0798765432",
      Patient_Email: "zzulu@outlook.com",
      DOB: "1995-07-25",
      Address: "88 Ridge Way, Pretoria",
      Gender: "Female",
      CreatedDate: new Date(Date.now() - 86400000 * 2),
    },
    {
      PatientID: 4,
      PatientName: "Bongani",
      PatientSurname: "Sithole",
      Patient_ContactNo: "0619876543",
      Patient_Email: "bongani.s@gmail.com",
      DOB: "2003-02-14",
      Address: "12 Jan Smuts Ave, Rosebank",
      Gender: "Male",
      CreatedDate: new Date(Date.now() - 86400000 * 5),
    },
  ],

  catalogue: [
    { CatalougeID: 1, Type: "Clinical Services", Name: "Consultation (incl meds)", Price: 250.0, discount: 50.0 },
    { CatalougeID: 2, Type: "Clinical Services", Name: "Family Planning", Price: 150.0, discount: 50.0 },
    { CatalougeID: 3, Type: "Clinical Services", Name: "Implanon insertion", Price: 300.0, discount: 50.0 },
    { CatalougeID: 4, Type: "Clinical Services", Name: "Implanon removal", Price: 350.0, discount: 50.0 },
    { CatalougeID: 5, Type: "Clinical Services", Name: "Pregnancy Test", Price: 50.0, discount: 50.0 },
    { CatalougeID: 6, Type: "Clinical Services", Name: "HIV Testing", Price: 100.0, discount: 50.0 },
    { CatalougeID: 7, Type: "Clinical Services", Name: "HIV PrEP/PEP", Price: 350.0, discount: 50.0 },
    { CatalougeID: 8, Type: "Clinical Services", Name: "HIV Care (Excl labs)", Price: 350.0, discount: 50.0 },
    { CatalougeID: 9, Type: "Clinical Services", Name: "Chronic Illness", Price: 300.0, discount: 50.0 },
    { CatalougeID: 10, Type: "Clinical Services", Name: "STI Management", Price: 300.0, discount: 50.0 },
    { CatalougeID: 11, Type: "Clinical Services", Name: "Acne Care", Price: 250.0, discount: 50.0 },
    { CatalougeID: 12, Type: "Clinical Services", Name: "Papsmear/ PSA", Price: 250.0, discount: 50.0 },
    { CatalougeID: 13, Type: "Clinical Services", Name: "BP/ HGT Check", Price: 50.0, discount: 50.0 },
    { CatalougeID: 14, Type: "Wellness Services", Name: "Vita Shots (Bco/ C/ B12/ Magnesium)", Price: 50.0, discount: null },
    { CatalougeID: 15, Type: "Wellness Services", Name: "Glutathione Shot", Price: 200.0, discount: null },
    { CatalougeID: 16, Type: "Wellness Services", Name: "Glow Drip", Price: 500.0, discount: null },
    { CatalougeID: 17, Type: "Wellness Services", Name: "Recovery Drip", Price: 400.0, discount: null },
    { CatalougeID: 18, Type: "Wellness Services", Name: "Energy Drip", Price: 300.0, discount: null },
    { CatalougeID: 19, Type: "Wellness Services", Name: "Hangover Drip", Price: 350.0, discount: null },
  ],

  appointments: [
    {
      AppointID: 1,
      PatientID: 1,
      MedicalAidNumber: "987654321",
      StartTime: new Date(new Date().setHours(9, 30, 0, 0)),
      EndTime: new Date(new Date().setHours(10, 0, 0, 0)),
      UserID: 3,
      MedicalAidName: "Discovery Health",
      Status: "Pending",
      Booking_Type: "Inclinic_Booking",
      ServiceName: "Consultation (incl meds)",
      ServicePrice: 250,
      MedicalAid_MainMember: "Nandi Mabaso",
      MainMember__IDNo: "9804120123089",
      MedicalAid_option: "Classic Delta",
      PaymentMethod: "Medical Aid",
      FinalPrice: 200,
      IsStudent: true,
      isFollow_Up: false,
    },
    {
      AppointID: 2,
      PatientID: 2,
      MedicalAidNumber: "",
      StartTime: new Date(new Date().setHours(11, 0, 0, 0)),
      EndTime: new Date(new Date().setHours(11, 30, 0, 0)),
      UserID: 4,
      MedicalAidName: "",
      Status: "InPatient",
      Booking_Type: "Inclinic_Booking",
      ServiceName: "Energy Drip",
      ServicePrice: 300,
      MedicalAid_MainMember: "",
      MainMember__IDNo: "",
      MedicalAid_option: "",
      PaymentMethod: "Card",
      FinalPrice: 300,
      IsStudent: false,
      isFollow_Up: false,
    },
    {
      AppointID: 3,
      PatientID: 3,
      MedicalAidNumber: "456789123",
      StartTime: new Date(new Date().setHours(14, 0, 0, 0)),
      EndTime: new Date(new Date().setHours(14, 30, 0, 0)),
      UserID: 3,
      MedicalAidName: "Momentum",
      Status: "Completed",
      Booking_Type: "Inclinic_Booking",
      ServiceName: "Acne Care",
      ServicePrice: 250,
      MedicalAid_MainMember: "Zandile Zulu",
      MainMember__IDNo: "9507250123081",
      MedicalAid_option: "Custom",
      PaymentMethod: "Cash",
      FinalPrice: 250,
      IsStudent: false,
      isFollow_Up: true,
    },
  ],

  register: [
    {
      RegisterID: 1,
      UserID: 3,
      Date: new Date().toISOString().split("T")[0],
      TimeIn: "08:55:00",
      TimeOut: null,
      OnLeave: "No",
      remark_OnArrival: "Arrived on time",
      HoursWorked: null,
    },
  ],

  payroll: [
    {
      PayrollID: 1,
      FullName: "Sister Thandiwe Mokoena",
      Bank: "CAPITEC",
      Position: "Senior Professional Nurse",
      AccountNumber: "1489201948",
      Status: "Permanent",
      Salary: 32500.0,
      Month: new Date().getMonth() + 1,
      Year: new Date().getFullYear(),
      CreatedAt: new Date(),
    },
    {
      PayrollID: 2,
      FullName: "Nurse Nomvula Khumalo",
      Bank: "FNB",
      Position: "Staff Nurse",
      AccountNumber: "62891048291",
      Status: "Permanent",
      Salary: 24000.0,
      Month: new Date().getMonth() + 1,
      Year: new Date().getFullYear(),
      CreatedAt: new Date(),
    },
    {
      PayrollID: 3,
      FullName: "Dr. Sipho Dlamini",
      Bank: "STANDARD BANK",
      Position: "Consulting Physician",
      AccountNumber: "002948194",
      Status: "LOCUM",
      Salary: 45000.0,
      Month: new Date().getMonth() + 1,
      Year: new Date().getFullYear(),
      CreatedAt: new Date(),
    },
    {
      PayrollID: 4,
      FullName: "Kagiso Molefe",
      Bank: "NEDBANK",
      Position: "Receptionist / Clinic Admin",
      AccountNumber: "1194019284",
      Status: "Permanent",
      Salary: 14500.0,
      Month: new Date().getMonth() + 1,
      Year: new Date().getFullYear(),
      CreatedAt: new Date(),
    },
  ],
};

let nextPatientId = 5;
let nextAppointmentId = 4;
let nextUserId = 6;
let nextRegisterId = 2;
let nextCatalogueId = 20;
let nextPayrollId = 5;

let pool = null;
let useMock =
  !process.env.DB_SERVER ||
  !process.env.DB_SERVER.trim() ||
  process.env.DB_SERVER.toLowerCase().includes("example") ||
  process.env.DB_SERVER.toLowerCase().includes("your_server");

// Helper to test if a date is today
function isSameDate(d1, d2 = new Date()) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// In-Memory Query Engine
function executeMockQuery(queryString, paramMap = {}) {
  const q = queryString.trim();
  const qUpper = q.toUpperCase();

  // 1. AUTH / USER QUERIES
  if (qUpper.includes("FROM USERS")) {
    if (qUpper.includes("WHERE USERNAME =") || qUpper.includes("LOWER(USERNAME)")) {
      const usernameParam = paramMap["p0"] ?? paramMap["UserName"] ?? "";
      const user = mockData.users.find(
        (u) => u.UserName.toLowerCase() === String(usernameParam).trim().toLowerCase()
      );
      return user ? [user] : [];
    }
    if (qUpper.includes("WHERE USERID =")) {
      const idParam = paramMap["p0"] ?? paramMap["id"] ?? paramMap["UserID"];
      const user = mockData.users.find((u) => String(u.UserID) === String(idParam));
      return user ? [user] : [];
    }
    if (qUpper.includes("USERROLE = 'N'")) {
      return mockData.users.filter((u) => u.UserRole === "N");
    }
    return mockData.users.map((u) => ({
      UserID: u.UserID,
      Name: u.Name,
      Surname: u.Surname,
      Email: u.Email,
      UserRole: u.UserRole,
    }));
  }

  if (qUpper.startsWith("INSERT INTO USERS")) {
    const newUser = {
      UserID: nextUserId++,
      UserName: paramMap["p0"],
      Password: paramMap["p1"],
      Name: paramMap["p2"],
      Surname: paramMap["p3"],
      Email: paramMap["p4"],
      ContactNo: paramMap["p5"],
      DOB: paramMap["p6"],
      UserRole: paramMap["p7"] || "E",
      SANC_HPCSA: paramMap["p8"],
    };
    mockData.users.push(newUser);
    return [];
  }

  // 2. DASHBOARD STATS
  if (qUpper.includes("SELECT COUNT(*) AS COUNT FROM PATIENTS WHERE CREATEDDATE BETWEEN")) {
    const count = mockData.patients.filter((p) => isSameDate(p.CreatedDate)).length;
    return [{ count }];
  }
  if (qUpper.includes("SELECT COUNT(*) AS COUNT FROM APPOINTMENTS WHERE STARTTIME BETWEEN")) {
    const count = mockData.appointments.filter((a) => isSameDate(a.StartTime)).length;
    return [{ count }];
  }
  if (qUpper.includes("SELECT COUNT(*) AS COUNT FROM PATIENTS")) {
    return [{ count: mockData.patients.length }];
  }
  if (qUpper.includes("SELECT COUNT(*) AS COUNT FROM APPOINTMENTS WHERE STATUS = 'PENDING'")) {
    const count = mockData.appointments.filter((a) => (a.Status || "").toLowerCase() === "pending").length;
    return [{ count }];
  }

  // 3. PATIENTS QUERIES
  if (qUpper.startsWith("INSERT INTO PATIENTS")) {
    const newPatient = {
      PatientID: nextPatientId++,
      PatientName: paramMap["p0"],
      PatientSurname: paramMap["p1"],
      Patient_Email: paramMap["p2"],
      Patient_ContactNo: paramMap["p3"],
      DOB: paramMap["p4"],
      Address: paramMap["p5"],
      Gender: paramMap["p6"],
      CreatedDate: paramMap["p7"] ? new Date(paramMap["p7"]) : new Date(),
    };
    mockData.patients.unshift(newPatient);
    return [];
  }

  if (qUpper.startsWith("UPDATE PATIENTS SET")) {
    const id = paramMap["p7"] ?? paramMap["id"];
    const patient = mockData.patients.find((p) => String(p.PatientID) === String(id));
    if (patient) {
      patient.PatientName = paramMap["p0"] ?? patient.PatientName;
      patient.PatientSurname = paramMap["p1"] ?? patient.PatientSurname;
      patient.Patient_ContactNo = paramMap["p2"] ?? patient.Patient_ContactNo;
      patient.Patient_Email = paramMap["p3"] ?? patient.Patient_Email;
      patient.DOB = paramMap["p4"] ?? patient.DOB;
      patient.Address = paramMap["p5"] ?? patient.Address;
      patient.Gender = paramMap["p6"] ?? patient.Gender;
    }
    return [];
  }

  if (qUpper.startsWith("DELETE FROM PATIENTS")) {
    const id = paramMap["p0"] ?? paramMap["id"];
    const idx = mockData.patients.findIndex((p) => String(p.PatientID) === String(id));
    if (idx !== -1) mockData.patients.splice(idx, 1);
    return [];
  }

  if (qUpper.includes("FROM PATIENTS")) {
    if (qUpper.includes("WHERE PATIENTID =")) {
      const id = paramMap["p0"] ?? paramMap["id"];
      const patient = mockData.patients.find((p) => String(p.PatientID) === String(id));
      return patient ? [patient] : [];
    }
    return [...mockData.patients].sort((a, b) => b.PatientID - a.PatientID);
  }

  // 4. CATALOGUE QUERIES
  if (qUpper.includes("FROM CATALOGUE")) {
    if (qUpper.includes("WHERE NAME =")) {
      const name = paramMap["ServiceName"] ?? paramMap["p0"] ?? "";
      const item = mockData.catalogue.find((c) => c.Name.toLowerCase() === String(name).toLowerCase());
      return item ? [{ Price: item.Price, discount: item.discount }] : [];
    }
    return mockData.catalogue;
  }

  if (qUpper.startsWith("INSERT INTO CATALOGUE")) {
    const item = {
      CatalougeID: nextCatalogueId++,
      Type: paramMap["p0"],
      Name: paramMap["p1"],
      Price: paramMap["p2"],
      discount: paramMap["p3"],
    };
    mockData.catalogue.push(item);
    return [];
  }

  // 5. APPOINTMENTS & BOOKINGS QUERIES
  if (qUpper.startsWith("INSERT INTO APPOINTMENTS")) {
    const newAppt = {
      AppointID: nextAppointmentId++,
      PatientID: paramMap["PatientID"] ?? paramMap["p0"],
      MedicalAidNumber: paramMap["MedicalAidNumber"] ?? paramMap["p1"] ?? "",
      StartTime: paramMap["StartTime"] ?? paramMap["p2"] ? new Date(paramMap["StartTime"] ?? paramMap["p2"]) : new Date(),
      EndTime: paramMap["EndTime"] ?? paramMap["p3"] ? new Date(paramMap["EndTime"] ?? paramMap["p3"]) : null,
      UserID: paramMap["UserID"] ?? paramMap["p4"],
      MedicalAidName: paramMap["MedicalAidName"] ?? paramMap["p5"] ?? "",
      Status: paramMap["Status"] ?? paramMap["p6"] ?? "InPatient",
      Booking_Type: paramMap["Booking_Type"] ?? "Inclinic_Booking",
      ServiceName: paramMap["ServiceName"] ?? paramMap["p7"] ?? "",
      ServicePrice: paramMap["ServicePrice"] ?? paramMap["p8"] ?? null,
      MedicalAid_MainMember: paramMap["MedicalAid_MainMember"] ?? paramMap["p9"] ?? "",
      MainMember__IDNo: paramMap["MainMember__IDNo"] ?? paramMap["p10"] ?? "",
      MedicalAid_option: paramMap["MedicalAid_option"] ?? paramMap["p11"] ?? "",
      PaymentMethod: paramMap["PaymentMethod"] ?? paramMap["p12"] ?? "Cash",
      FinalPrice: paramMap["FinalPrice"] ?? paramMap["p13"] ?? null,
      IsStudent: Boolean(paramMap["IsStudent"] ?? paramMap["p14"]),
      isFollow_Up: false,
    };
    mockData.appointments.push(newAppt);
    return [];
  }

  if (qUpper.startsWith("UPDATE APPOINTMENTS SET")) {
    const whereIdx = qUpper.indexOf("WHERE");
    let id = null;
    if (whereIdx !== -1) {
      const whereClause = q.slice(whereIdx);
      const idMatch = whereClause.match(/(?:AppointID|id)\s*=\s*(?:@(\w+)|\b(\d+)\b)/i);
      if (idMatch) {
        if (idMatch[1] && paramMap[idMatch[1]] !== undefined) {
          id = paramMap[idMatch[1]];
        } else if (idMatch[2]) {
          id = idMatch[2];
        }
      }
    }
    if (!id) {
      id = paramMap[`p${Object.keys(paramMap).length - 1}`] ?? paramMap["id"] ?? paramMap["AppointID"];
    }

    const appt = mockData.appointments.find((a) => String(a.AppointID) === String(id));
    if (appt) {
      if (whereIdx !== -1) {
        const setPart = q.slice(qUpper.indexOf("SET") + 3, whereIdx);
        const assignments = setPart.split(",");
        for (const assign of assignments) {
          const parts = assign.split("=");
          if (parts.length === 2) {
            const rawCol = parts[0].trim().replace(/[\[\]]/g, "");
            const rawVal = parts[1].trim();
            if (rawVal.startsWith("@")) {
              const pKey = rawVal.substring(1);
              if (paramMap[pKey] !== undefined) {
                appt[rawCol] = paramMap[pKey];
              }
            } else {
              appt[rawCol] = rawVal.replace(/^'|'$/g, "");
            }
          }
        }
      }
      Object.entries(paramMap).forEach(([k, v]) => {
        if (!k.startsWith("p") && k !== "AppointID" && k !== "id") {
          appt[k] = v;
        }
      });
    }
    return [];
  }

  if (qUpper.startsWith("DELETE FROM APPOINTMENTS")) {
    const whereIdx = qUpper.indexOf("WHERE");
    let id = null;
    if (whereIdx !== -1) {
      const whereClause = q.slice(whereIdx);
      const idMatch = whereClause.match(/(?:AppointID|id)\s*=\s*(?:@(\w+)|\b(\d+)\b)/i);
      if (idMatch) {
        if (idMatch[1] && paramMap[idMatch[1]] !== undefined) {
          id = paramMap[idMatch[1]];
        } else if (idMatch[2]) {
          id = idMatch[2];
        }
      }
    }
    if (!id) {
      id = paramMap["p0"] ?? paramMap["id"] ?? paramMap["AppointID"] ?? Object.values(paramMap)[0];
    }
    const idx = mockData.appointments.findIndex((a) => String(a.AppointID) === String(id));
    if (idx !== -1) mockData.appointments.splice(idx, 1);
    return [];
  }

  if (qUpper.includes("FROM APPOINTMENTS")) {
    // Latest medical aid
    if (qUpper.includes("ORDER BY STARTTIME DESC") && qUpper.includes("WHERE PATIENTID =")) {
      const patientId = paramMap["PatientID"] ?? paramMap["p0"];
      const sorted = mockData.appointments
        .filter((a) => String(a.PatientID) === String(patientId) && a.MedicalAidName?.trim())
        .sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());
      if (!sorted.length) return [];
      const top = sorted[0];
      return [
        {
          MedicalAidNumber: top.MedicalAidNumber || "",
          MedicalAidName: top.MedicalAidName || "",
          MedicalAid_MainMember: top.MedicalAid_MainMember || "",
          MainMember__IDNo: top.MainMember__IDNo || "",
          MedicalAid_option: top.MedicalAid_option || "",
        },
      ];
    }

    // Join helper
    const enrich = (a) => {
      const p = mockData.patients.find((pat) => pat.PatientID === a.PatientID) || {};
      const u = mockData.users.find((usr) => usr.UserID === a.UserID) || {};
      return {
        id: a.AppointID,
        AppointID: a.AppointID,
        patientName: `${p.PatientName || ""} ${p.PatientSurname || ""}`.trim() || "Patient",
        PatientID: a.PatientID,
        PatientName: p.PatientName || "",
        PatientSurname: p.PatientSurname || "",
        MedicalAidNumber: a.MedicalAidNumber || "",
        StartTime: a.StartTime ? new Date(a.StartTime).toISOString() : null,
        EndTime: a.EndTime ? new Date(a.EndTime).toISOString() : null,
        UserID: a.UserID,
        MedicalAidName: a.MedicalAidName || "",
        Status: a.Status || "InPatient",
        Booking_Type: a.Booking_Type || "Inclinic_Booking",
        ServiceName: a.ServiceName || "",
        ServicePrice: a.ServicePrice,
        FinalPrice: a.FinalPrice,
        MedicalAid_MainMember: a.MedicalAid_MainMember || "",
        MainMember__IDNo: a.MainMember__IDNo || "",
        MedicalAid_option: a.MedicalAid_option || "",
        PaymentMethod: a.PaymentMethod || "Cash",
        IsStudent: Boolean(a.IsStudent),
        isFollow_Up: Boolean(
          a.isFollow_Up === true ||
          a.isFollow_Up === 1 ||
          a.isFollow_Up === "1" ||
          String(a.isFollow_Up).toLowerCase() === "true" ||
          a.isFollow_Up === "Yes"
        ),
        doctorName: `${u.Name || ""} ${u.Surname || ""}`.trim() || "Doctor/Nurse",
        UserName: u.Name || "",
        UserSurname: u.Surname || "",
      };
    };

    // Single appointment by ID
    if (qUpper.includes("APPOINTID = @P0") || qUpper.includes("APPOINTID = @ID")) {
      const id = paramMap["p0"] ?? paramMap["id"];
      const appt = mockData.appointments.find((a) => String(a.AppointID) === String(id));
      return appt ? [enrich(appt)] : [];
    }

    // Today's appointments (bookings)
    return mockData.appointments
      .filter((a) => isSameDate(a.StartTime))
      .sort((a, b) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime())
      .map(enrich);
  }

  // 6. ATTENDANCE (REGISTER) QUERIES
  if (qUpper.includes("FROM REGISTER")) {
    if (qUpper.includes("WHERE USERID =") && qUpper.includes("DATE =")) {
      const userId = paramMap["p0"] ?? paramMap["userId"];
      const todayStr = new Date().toISOString().split("T")[0];
      return mockData.register.filter(
        (r) => String(r.UserID) === String(userId) && (r.Date === todayStr || isSameDate(r.Date))
      );
    }
    // GET /today
    return mockData.register
      .filter((r) => isSameDate(r.Date))
      .map((r) => {
        const u = mockData.users.find((usr) => usr.UserID === r.UserID) || {};
        return {
          Name: u.Name || "Staff",
          Surname: u.Surname || "",
          TimeIn: r.TimeIn,
          TimeOut: r.TimeOut,
          OnLeave: r.OnLeave,
          remark_OnArrival: r.remark_OnArrival,
        };
      });
  }

  if (qUpper.startsWith("INSERT INTO REGISTER")) {
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];
    const isLeave = paramMap["p1"] === "On leave" || qUpper.includes("'ON LEAVE'");
    const newReg = {
      RegisterID: nextRegisterId++,
      UserID: paramMap["p0"],
      Date: todayStr,
      TimeIn: isLeave ? "00:00:00" : nowTime,
      TimeOut: isLeave ? "00:00:00" : null,
      OnLeave: isLeave ? "Yes" : "No",
      remark_OnArrival: paramMap["p1"] || (isLeave ? "On leave" : "Arrived on time"),
      HoursWorked: 0,
    };
    mockData.register.push(newReg);
    return [];
  }

  if (qUpper.startsWith("UPDATE REGISTER SET")) {
    const userId = paramMap["p0"] ?? paramMap["userId"];
    const nowTime = new Date().toTimeString().split(" ")[0];
    const reg = mockData.register.find(
      (r) => String(r.UserID) === String(userId) && isSameDate(r.Date)
    );
    if (reg) {
      reg.TimeOut = nowTime;
      reg.HoursWorked = 8;
    }
    return [];
  }

  // 6. PAYROLL QUERIES
  if (qUpper.startsWith("INSERT INTO PAYROLL")) {
    const newItem = {
      PayrollID: nextPayrollId++,
      FullName: paramMap["FullName"] || paramMap["p0"] || "Staff Member",
      Bank: paramMap["Bank"] || paramMap["p1"] || "CAPITEC",
      Position: paramMap["Position"] || paramMap["p2"] || "Nurse",
      AccountNumber: paramMap["AccountNumber"] || paramMap["p3"] || "1000000000",
      Status: paramMap["Status"] || paramMap["p4"] || "Permanent",
      Salary: parseFloat(paramMap["Salary"] || paramMap["p5"] || 0),
      Month: parseInt(paramMap["Month"] || paramMap["p6"] || new Date().getMonth() + 1),
      Year: parseInt(paramMap["Year"] || paramMap["p7"] || new Date().getFullYear()),
      CreatedAt: new Date(),
    };
    mockData.payroll.push(newItem);
    return [newItem];
  }

  if (qUpper.startsWith("UPDATE PAYROLL")) {
    const id = paramMap["id"] ?? paramMap["p6"];
    const item = mockData.payroll.find((p) => String(p.PayrollID) === String(id));
    if (item) {
      if (paramMap["FullName"] !== undefined) item.FullName = paramMap["FullName"];
      if (paramMap["Bank"] !== undefined) item.Bank = paramMap["Bank"];
      if (paramMap["Position"] !== undefined) item.Position = paramMap["Position"];
      if (paramMap["AccountNumber"] !== undefined) item.AccountNumber = paramMap["AccountNumber"];
      if (paramMap["Status"] !== undefined) item.Status = paramMap["Status"];
      if (paramMap["Salary"] !== undefined) item.Salary = parseFloat(paramMap["Salary"]);
      return [item];
    }
    return [];
  }

  if (qUpper.startsWith("DELETE FROM PAYROLL")) {
    const id = paramMap["id"] ?? paramMap["p0"];
    const idx = mockData.payroll.findIndex((p) => String(p.PayrollID) === String(id));
    if (idx !== -1) mockData.payroll.splice(idx, 1);
    return [];
  }

  if (qUpper.includes("FROM PAYROLL")) {
    let list = [...mockData.payroll];
    const month = paramMap["month"];
    const year = paramMap["year"];
    if (month && year) {
      list = list.filter((p) => p.Month === parseInt(month) && p.Year === parseInt(year));
    }
    return list;
  }

  // 7. REGISTER QUERIES
  if (qUpper.includes("FROM REGISTER")) {
    return mockData.register.map((r) => ({
      RegisterID: r.RegisterID,
      UserID: r.UserID,
      Date: r.Date,
      TimeIn: r.TimeIn,
      TimeOut: r.TimeOut,
      OnLeave: r.OnLeave,
      remark_OnArrival: r.remark_OnArrival,
      HoursWorked: r.HoursWorked || 8,
    }));
  }

  return [];
}

// Mock Request Object mimicking mssql.Request
class MockRequest {
  constructor() {
    this.params = {};
  }

  input(name, typeOrValue, value) {
    const actualValue = value !== undefined ? value : typeOrValue;
    this.params[name] = actualValue;
    return this;
  }

  async query(queryString) {
    const records = executeMockQuery(queryString, this.params);
    return {
      recordset: records,
      recordsets: [records],
      rowsAffected: [records.length],
    };
  }
}

// Mock Pool Object mimicking mssql.ConnectionPool
const mockPool = {
  request() {
    return new MockRequest();
  },
  connected: true,
};

let connectingPromise = null;
let lastFailureTime = 0;
const RETRY_COOLDOWN_MS = 10000; // 10s cooldown between failed connection attempts

// Lazy connection: Connects to Azure SQL with automatic fallback to mock store if temporarily unavailable
export async function getPool() {
  if (useMock) {
    return mockPool;
  }

  if (pool && pool.connected) {
    return pool;
  }

  // Prevent spamming connection attempts if it just failed
  const now = Date.now();
  if (now - lastFailureTime < RETRY_COOLDOWN_MS && !pool) {
    return mockPool;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      if (pool) {
        try {
          await pool.close();
        } catch {
          // ignore close error
        }
        pool = null;
      }

      console.log(`Connecting to Azure SQL server (${config.server}:${config.port}, Database: ${config.database})...`);
      pool = await sql.connect(config);
      console.log(`✅ Azure SQL connected successfully to ${config.server} (Database: ${config.database})`);
      connectingPromise = null;
      return pool;
    } catch (err) {
      lastFailureTime = Date.now();
      connectingPromise = null;
      console.warn(`⚠️ Azure SQL connection attempt failed (${err.message}). Using in-memory store as fallback until next retry.`);
      pool = null;
      return mockPool;
    }
  })();

  return connectingPromise;
}

// Query helper used across routes
export async function query(q, params = []) {
  if (useMock) {
    const paramMap = {};
    params.forEach((p, i) => {
      paramMap[`p${i}`] = p;
    });
    return executeMockQuery(q, paramMap);
  }

  try {
    const p = await getPool();
    if (!p || p === mockPool || !p.connected) {
      const paramMap = {};
      params.forEach((val, i) => {
        paramMap[`p${i}`] = val;
      });
      return executeMockQuery(q, paramMap);
    }

    const request = p.request();
    params.forEach((val, i) => {
      request.input(`p${i}`, val);
    });

    const result = await request.query(q);
    return result.recordset;
  } catch (err) {
    console.warn("⚠️ Query execution failed on SQL (" + err.message + "). Falling back to in-memory store for this query.");
    const paramMap = {};
    params.forEach((val, i) => {
      paramMap[`p${i}`] = val;
    });
    return executeMockQuery(q, paramMap);
  }
}

export { sql };
export default getPool;
