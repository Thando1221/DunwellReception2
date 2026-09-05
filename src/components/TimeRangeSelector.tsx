import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { TimeRange, DateRange, getDateRange } from "@/lib/mockData";

interface TimeRangeSelectorProps {
  onRangeChange: (range: DateRange, type: TimeRange) => void;
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TimeRangeSelector = ({ onRangeChange }: TimeRangeSelectorProps) => {
  const [rangeType, setRangeType] = useState<TimeRange>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleChange = (type: TimeRange, month?: number, year?: number, cStart?: string, cEnd?: string) => {
    const refDate = new Date(year ?? selectedYear, month ?? selectedMonth, 1);
    let range: DateRange;
    if (type === "custom" && cStart && cEnd) {
      range = getDateRange("custom", refDate, undefined, { start: new Date(cStart), end: new Date(cEnd) });
    } else if (type === "weekly") {
      range = getDateRange("weekly", refDate, month ?? selectedMonth);
    } else {
      range = getDateRange(type, refDate);
    }
    onRangeChange(range, type);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 glass-card rounded-xl">
      <div className="flex items-center gap-2 text-primary">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-semibold font-heading">Time Range</span>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Period</Label>
        <Select value={rangeType} onValueChange={(v: TimeRange) => { setRangeType(v); handleChange(v); }}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="semi-quarterly">Semi-Annual</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Year</Label>
        <Select value={String(selectedYear)} onValueChange={(v) => { setSelectedYear(Number(v)); handleChange(rangeType, selectedMonth, Number(v)); }}>
          <SelectTrigger className="w-[100px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(rangeType === "weekly" || rangeType === "monthly") && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={String(selectedMonth)} onValueChange={(v) => { setSelectedMonth(Number(v)); handleChange(rangeType, Number(v)); }}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {rangeType === "custom" && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start</Label>
            <Input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); if (customEnd) handleChange("custom", undefined, undefined, e.target.value, customEnd); }} className="w-[150px] h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End</Label>
            <Input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); if (customStart) handleChange("custom", undefined, undefined, customStart, e.target.value); }} className="w-[150px] h-9 text-sm" />
          </div>
        </>
      )}
    </div>
  );
};

export default TimeRangeSelector;
