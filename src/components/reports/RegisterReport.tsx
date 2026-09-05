import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { useClinicData } from "@/hooks/useClinicData";
import { DateRange } from "@/lib/mockData";
import { Clock, UserCheck, CalendarOff, Loader2 } from "lucide-react";

interface RegisterReportProps {
  dateRange: DateRange;
}

const RegisterReport = ({ dateRange }: RegisterReportProps) => {
  const { register: filtered, users, loading } = useClinicData();

  const employeeData = useMemo(() => {
    return users.map(user => {
      const entries = filtered.filter(r => r.UserID === user.UserID);
      return {
        name: `${user.Name} ${user.Surname}`,
        userId: user.UserID,
        daysPresent: entries.filter(r => !r.OnLeave).length,
        daysOff: entries.filter(r => r.OnLeave).length,
        totalHours: Math.round(entries.reduce((sum, r) => sum + (r.HoursWorked || 0), 0) * 10) / 10,
      };
    });
  }, [filtered, users]);

  const totalPresent = employeeData.reduce((s, e) => s + e.daysPresent, 0);
  const totalOff = employeeData.reduce((s, e) => s + e.daysOff, 0);
  const totalHours = employeeData.reduce((s, e) => s + e.totalHours, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6" id="register-report">
      <h2 className="text-xl font-bold font-heading text-foreground">Employee Register Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Hours Worked" value={totalHours} icon={Clock} />
        <StatCard title="Total Days Present" value={totalPresent} icon={UserCheck} />
        <StatCard title="Total Days Off" value={totalOff} icon={CalendarOff} />
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Employee Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Days Present</TableHead>
                <TableHead className="text-right">Days Off</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeData.map(emp => (
                <TableRow key={emp.userId}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-right">{emp.totalHours}</TableCell>
                  <TableCell className="text-right">{emp.daysPresent}</TableCell>
                  <TableCell className="text-right">{emp.daysOff}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm font-heading">Hours Worked by Employee</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={employeeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="totalHours" fill="hsl(222,47%,25%)" radius={[6, 6, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterReport;
