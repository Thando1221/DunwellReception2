import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { fetchPatients, fetchAppointments, fetchRegister, fetchUsers, fetchCatalogue } from "@/lib/api";
import { DateRange } from "@/lib/mockData";

// Fallback imports for when API is unavailable
import { patients as mockPatients, appointments as mockAppointments, registerEntries as mockRegister, users as mockUsers, catalogue as mockCatalogue, filterByDateRange } from "@/lib/mockData";

interface ClinicData {
  patients: any[];
  appointments: any[];
  register: any[];
  users: any[];
  catalogue: any[];
  loading: boolean;
  error: string | null;
  usingMockData: boolean;
}

const ClinicDataContext = createContext<ClinicData>({
  patients: [], appointments: [], register: [], users: [], catalogue: [],
  loading: false, error: null, usingMockData: true,
});

export const useClinicData = () => useContext(ClinicDataContext);

export function ClinicDataProvider({ dateRange, children }: { dateRange: DateRange; children: ReactNode }) {
  const [data, setData] = useState<ClinicData>({
    patients: [], appointments: [], register: [], users: [], catalogue: [],
    loading: true, error: null, usingMockData: false,
  });

  useEffect(() => {
    let cancelled = false;
    const startDate = dateRange.start.toISOString();
    const endDate = dateRange.end.toISOString();

    async function load() {
      setData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const [patients, appointments, register, users, catalogue] = await Promise.all([
          fetchPatients(startDate, endDate),
          fetchAppointments(startDate, endDate),
          fetchRegister(startDate, endDate),
          fetchUsers(),
          fetchCatalogue(),
        ]);
        if (!cancelled) {
          setData({ patients, appointments, register, users, catalogue, loading: false, error: null, usingMockData: false });
        }
      } catch (err: any) {
        console.warn("API unavailable, using mock data:", err.message);
        if (!cancelled) {
          // Fallback to mock data
          setData({
            patients: filterByDateRange(mockPatients, "CreatedDate", dateRange),
            appointments: filterByDateRange(mockAppointments, "StartTime", dateRange),
            register: filterByDateRange(mockRegister, "Date", dateRange),
            users: mockUsers,
            catalogue: mockCatalogue,
            loading: false,
            error: null,
            usingMockData: true,
          });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dateRange]);

  return (
    <ClinicDataContext.Provider value={data}>
      {children}
    </ClinicDataContext.Provider>
  );
}
