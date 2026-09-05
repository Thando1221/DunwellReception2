import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { useClinicData } from "@/hooks/useClinicData";
import { DateRange } from "@/lib/mockData";
import { CalendarCheck, GraduationCap, CreditCard, Stethoscope, RefreshCw, Loader2 } from "lucide-react";

const COLORS = ["hsl(222,47%,25%)", "hsl(45,93%,47%)", "hsl(262,52%,55%)", "hsl(340,65%,55%)", "hsl(200,70%,50%)", "hsl(120,50%,40%)", "hsl(30,80%,50%)", "hsl(280,50%,50%)", "hsl(0,70%,50%)", "hsl(210,60%,50%)"];

interface AppointmentReportProps {
  dateRange: DateRange;
}

const AppointmentReport = ({ dateRange }: AppointmentReportProps) => {
  const { appointments: filtered, loading } = useClinicData();
  const totalAppointments = filtered.length;
  const students = filtered.filter(a => a.IsStudent).length;
  const followUps = filtered.filter(a => a.isFollow_Up).length;

  const serviceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(a => { counts[a.ServiceName] = (counts[a.ServiceName] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const paymentCount = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(a => { counts[a.PaymentMethod] = (counts[a.PaymentMethod] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6" id="appointment-report">
      <h2 className="text-xl font-bold font-heading text-foreground">Appointment Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Appointments" value={totalAppointments} icon={CalendarCheck} />
        <StatCard title="Uni/Wits Students" value={students} icon={GraduationCap} subtitle={`${totalAppointments ? ((students / totalAppointments) * 100).toFixed(1) : 0}% of total`} />
        <StatCard title="Follow-Up Visits" value={followUps} icon={RefreshCw} subtitle={`${totalAppointments ? ((followUps / totalAppointments) * 100).toFixed(1) : 0}% of total`} />
        <StatCard title="Cash Payments" value={paymentCount.find(p => p.name === "Cash")?.value || 0} icon={CreditCard} />
        <StatCard title="Medical Aid" value={paymentCount.find(p => p.name === "Medical Aid")?.value || 0} icon={Stethoscope} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm font-heading">Services Selected</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={serviceCount} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(222,47%,25%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-sm font-heading">Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={paymentCount} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {paymentCount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Services Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead className="text-right">Times Selected</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceCount.map(s => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.value}</TableCell>
                  <TableCell className="text-right">{totalAppointments ? ((s.value / totalAppointments) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Payment Method Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentCount.map(p => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.value}</TableCell>
                  <TableCell className="text-right">{totalAppointments ? ((p.value / totalAppointments) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentReport;
