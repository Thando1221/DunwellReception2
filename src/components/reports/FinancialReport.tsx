import { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { useClinicData } from "@/hooks/useClinicData";
import { DateRange, TimeRange } from "@/lib/mockData";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Loader2 } from "lucide-react";

const COLORS = ["hsl(222,47%,25%)", "hsl(45,93%,47%)", "hsl(262,52%,55%)", "hsl(340,65%,55%)", "hsl(200,70%,50%)"];

interface FinancialReportProps {
  dateRange: DateRange;
  timeRangeType: TimeRange;
}

const FinancialReport = ({ dateRange, timeRangeType }: FinancialReportProps) => {
  const { appointments, loading } = useClinicData();

  // -----------------------------
  // 1. Filter appointments by date range (optional)
  // -----------------------------
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (!a.StartTime) return false;
      const start = new Date(a.StartTime);
      return (!dateRange || (start >= dateRange.start && start <= dateRange.end));
    });
  }, [appointments, dateRange]);

  // -----------------------------
  // 2. Total Revenue (FinalPrice fallback to ServicePrice)
  // -----------------------------
  const totalRevenue = useMemo(() => {
    return filtered.reduce((sum, a) => sum + (parseFloat(a.FinalPrice ?? a.ServicePrice) || 0), 0);
  }, [filtered]);

  // -----------------------------
  // 3. Revenue by Service
  // -----------------------------
  const revenueByService = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(a => {
      const price = parseFloat(a.FinalPrice ?? a.ServicePrice) || 0;
      const service = a.ServiceName || "Unknown";
      map[service] = (map[service] || 0) + price;
    });
    return Object.entries(map)
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // -----------------------------
  // 4. Revenue by Payment Method
  // -----------------------------
  const revenueByPayment = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(a => {
      const price = parseFloat(a.FinalPrice ?? a.ServicePrice) || 0;
      const payment = (a.PaymentMethod || "UNKNOWN").toUpperCase();
      map[payment] = (map[payment] || 0) + price;
    });
    return Object.entries(map).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  }, [filtered]);

  // -----------------------------
  // 5. Revenue by Period (Daily or Monthly)
  // -----------------------------
  const revenueByPeriod = useMemo(() => {
    const map: Record<string, number> = {};
    const isDaily = timeRangeType === "weekly" || timeRangeType === "monthly";
    filtered.forEach(a => {
      const d = new Date(a.StartTime);
      const key = isDaily 
        ? d.toISOString().split("T")[0] 
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const price = parseFloat(a.FinalPrice ?? a.ServicePrice) || 0;
      map[key] = (map[key] || 0) + price;
    });
    return Object.entries(map)
      .sort()
      .map(([period, revenue]) => ({ period: period.substring(isDaily ? 5 : 0), revenue: Math.round(revenue) }));
  }, [filtered, timeRangeType]);

  const highestPeriod = useMemo(() => revenueByPeriod.length ? revenueByPeriod.reduce((a,b)=> a.revenue>b.revenue?a:b) : null, [revenueByPeriod]);
  const lowestPeriod = useMemo(() => revenueByPeriod.length ? revenueByPeriod.reduce((a,b)=> a.revenue<b.revenue?a:b) : null, [revenueByPeriod]);

  // -----------------------------
  // 6. Medical Aid Counts
  // -----------------------------
  const medicalAidCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filtered
      .filter(a => (a.PaymentMethod || "").toUpperCase() === "MEDICAL-AID" && a.MedicalAidName)
      .forEach(a => { map[a.MedicalAidName!] = (map[a.MedicalAidName!] || 0) + 1; });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count);
  }, [filtered]);

  // -----------------------------
  // 7. Payment Counts
  // -----------------------------
  const cashCount = filtered.filter(a => (a.PaymentMethod || "").toUpperCase() === "CASH").length;
  const cardCount = filtered.filter(a => (a.PaymentMethod || "").toUpperCase() === "CARD").length;
  const medAidCount = filtered.filter(a => (a.PaymentMethod || "").toUpperCase() === "MEDICAL-AID").length;

  const paymentMethodAppointments = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(a => {
      const payment = (a.PaymentMethod || "UNKNOWN").toUpperCase();
      map[payment] = (map[payment] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // -----------------------------
  // 8. Render
  // -----------------------------
  return (
    <div className="space-y-6" id="financial-report">
      <h2 className="text-xl font-bold font-heading text-foreground">Financial Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`R ${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Cash Appointments" value={cashCount} icon={CreditCard} />
        <StatCard title="Credit Card" value={cardCount} icon={CreditCard} />
        <StatCard title="Medical Aid" value={medAidCount} icon={CreditCard} />
      </div>

      {highestPeriod && lowestPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card p-4 border-l-4 border-l-success">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Highest Revenue Period</p>
                <p className="font-bold font-heading text-foreground">{highestPeriod.period} — R {highestPeriod.revenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4 border-l-4 border-l-destructive">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Lowest Revenue Period</p>
                <p className="font-bold font-heading text-foreground">{lowestPeriod.period} — R {lowestPeriod.revenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-sm font-heading">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `R ${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(222,47%,25%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(45,93%,47%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm font-heading">Revenue per Service</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByService} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R ${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(45,93%,47%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm font-heading">Revenue per Payment Method</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={revenueByPayment} 
                  cx="50%" cy="50%" 
                  outerRadius={100} 
                  dataKey="revenue" 
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                >
                  {revenueByPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v:number) => `R ${v.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Medical Aid Breakdown</CardTitle></CardHeader>
        <CardContent>
          {medicalAidCounts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Most frequently used: <span className="font-semibold text-foreground">{medicalAidCounts[0]?.name}</span> ({medicalAidCounts[0]?.count} times)
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medical Aid Name</TableHead>
                    <TableHead className="text-right">Times Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicalAidCounts.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right">{m.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No medical aid data for this period.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Appointments per Payment Method</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentMethodAppointments}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(262,52%,55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;