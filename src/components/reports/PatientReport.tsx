import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { useClinicData } from "@/hooks/useClinicData";
import { DateRange } from "@/lib/mockData";
import { Users, UserPlus, Loader2 } from "lucide-react";

const COLORS = ["hsl(222,47%,25%)", "hsl(45,93%,47%)", "hsl(262,52%,55%)", "hsl(340,65%,55%)", "hsl(200,70%,50%)"];

interface PatientReportProps {
  dateRange: DateRange;
}

const PatientReport = ({ dateRange }: PatientReportProps) => {
  const { patients: filtered, loading } = useClinicData();
  const newPatients = filtered.length;

  // Count patients per gender
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((p) => {
      const gender = p.Gender || "Other";
      counts[gender] = (counts[gender] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const femaleCount = genderData.find((g) => g.name === "Female")?.value || 0;
  const maleCount = genderData.find((g) => g.name === "Male")?.value || 0;
  const lgbtqCount = genderData.find((g) => g.name !== "Male" && g.name !== "Female")?.value || 0;

  // Age groups
  const ageGroups = useMemo(() => {
    const groups: Record<string, number> = { "0-17": 0, "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 };
    filtered.forEach((p) => {
      const age = Math.floor((Date.now() - new Date(p.DOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) groups["0-17"]++;
      else if (age <= 25) groups["18-25"]++;
      else if (age <= 35) groups["26-35"]++;
      else if (age <= 45) groups["36-45"]++;
      else groups["46+"]++;
    });
    return Object.entries(groups).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  // Patients by CreatedDate (recent 15)
  const dateAddedData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filtered.forEach((p) => {
      const d = (p.CreatedDate || "").substring(0, 10);
      byDate[d] = (byDate[d] || 0) + 1;
    });
    return Object.entries(byDate)
      .sort()
      .slice(-15)
      .map(([date, count]) => ({ date: date.substring(5), count }));
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="patient-report">
      <h2 className="text-xl font-bold font-heading text-foreground">Patient Report</h2>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="New Patients" value={newPatients} icon={UserPlus} subtitle="In selected period" />
        <StatCard title="Female Patients" value={femaleCount} icon={Users} />
        <StatCard title="Male Patients" value={maleCount} icon={Users} />
        <StatCard title="LGBTQ+ Patients" value={lgbtqCount} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Patients by Age Group</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageGroups}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(222,47%,25%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Age Group Summary Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-heading">Age Group Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Age Group</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ageGroups.map((g) => (
                <TableRow key={g.name}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-right">{g.count}</TableCell>
                  <TableCell className="text-right">
                    {newPatients ? ((g.count / newPatients) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gender Summary Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-heading">Gender Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {genderData.map((g) => (
                <TableRow key={g.name}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-right">{g.value}</TableCell>
                  <TableCell className="text-right">
                    {newPatients ? ((g.value / newPatients) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Patients — Date Added Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-heading">New Patients — Date Added (CAME In)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dateAddedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(45,93%,47%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientReport;