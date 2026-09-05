import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import PatientReport from "@/components/reports/PatientReport";
import AppointmentReport from "@/components/reports/AppointmentReport";
import FinancialReport from "@/components/reports/FinancialReport";
import { ClinicDataProvider, useClinicData } from "@/hooks/useClinicData";
import { DateRange, TimeRange, getDateRange } from "@/lib/mockData";
import { generateFullReport, generateSectionPDF, PDFData } from "@/lib/pdfGenerator";
import {
  Users,
  CalendarCheck,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Database,
} from "lucide-react";
import { toast } from "sonner";

const ReportsDashboardContent = ({
  dateRange,
  timeRangeType,
}: {
  dateRange: DateRange;
  timeRangeType: TimeRange;
}) => {
  const [activeTab, setActiveTab] = useState("patients");
  const [generating, setGenerating] = useState(false);
  const { patients, appointments, register, users, usingMockData, loading } = useClinicData();

  const getPDFData = (): PDFData => ({ patients, appointments, register, users });

  const handleExportSection = async () => {
    setGenerating(true);
    toast.info(`Generating ${activeTab} PDF report...`);
    try {
      await generateSectionPDF(activeTab, dateRange, timeRangeType, getPDFData());
      toast.success(`${activeTab.toUpperCase()} PDF downloaded successfully`);
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF: " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleExportAll = async () => {
    setGenerating(true);
    toast.info("Generating comprehensive clinic report PDF...");
    try {
      await generateFullReport(dateRange, timeRangeType, getPDFData());
      toast.success("Comprehensive PDF report downloaded successfully");
    } catch (err: any) {
      console.error("Full PDF export error:", err);
      toast.error("Failed to generate Full PDF: " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Clinic Reports & Intelligence</h2>
            <p className="text-xs text-muted-foreground">
              Period: {dateRange.start.toLocaleDateString("en-ZA")} &ndash;{" "}
              {dateRange.end.toLocaleDateString("en-ZA")} ({timeRangeType})
            </p>
          </div>
          {usingMockData && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
              <Database className="w-3 h-3" /> Demo Data Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSection}
            disabled={generating || loading}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            )}
            Export {activeTab} PDF
          </Button>

          <Button
            size="sm"
            onClick={handleExportAll}
            disabled={generating || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Full Report PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-card border border-border h-auto p-1 gap-1">
            <TabsTrigger
              value="patients"
              className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-3.5"
            >
              <Users className="w-4 h-4" /> Patients
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-3.5"
            >
              <CalendarCheck className="w-4 h-4" /> Appointments
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="gap-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-3.5"
            >
              <DollarSign className="w-4 h-4" /> Financial
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="patients" className="mt-6 focus-visible:outline-none">
          <PatientReport dateRange={dateRange} />
        </TabsContent>
        <TabsContent value="appointments" className="mt-6 focus-visible:outline-none">
          <AppointmentReport dateRange={dateRange} />
        </TabsContent>
        <TabsContent value="financial" className="mt-6 focus-visible:outline-none">
          <FinancialReport dateRange={dateRange} timeRangeType={timeRangeType} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange("monthly"));
  const [timeRangeType, setTimeRangeType] = useState<TimeRange>("monthly");

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Filter */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Dunwell Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clinical statistics, appointment metrics, and financial performance intelligence.
          </p>
        </div>

        <TimeRangeSelector
          onRangeChange={(range, type) => {
            setDateRange(range);
            setTimeRangeType(type);
          }}
        />
      </div>

      <ClinicDataProvider dateRange={dateRange}>
        <ReportsDashboardContent dateRange={dateRange} timeRangeType={timeRangeType} />
      </ClinicDataProvider>
    </div>
  );
}
