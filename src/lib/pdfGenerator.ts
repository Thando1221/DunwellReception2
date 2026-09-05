import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DateRange, TimeRange } from "./mockData";
import clinicLogo from "@/assets/clinic-logo.ico";

const NAVY: [number, number, number] = [22, 36, 71];
const GOLD: [number, number, number] = [234, 179, 8];
const GREY: [number, number, number] = [100, 110, 120];
const LIGHT_GREY: [number, number, number] = [240, 242, 245];
const WHITE: [number, number, number] = [255, 255, 255];

export interface PDFData {
  patients: any[];
  appointments: any[];
  register: any[];
  users: any[];
  payroll?: any[];
}

function formatDateRange(range: DateRange): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(range.start)} — ${fmt(range.end)}`;
}

function drawHR(doc: jsPDF, y: number) {
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
}

function drawGoldAccent(doc: jsPDF, y: number, width = 36) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(2);
  doc.line(14, y, 14 + width, y);
}

// ========== LOAD LOGO ==========
async function loadLogo(): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = clinicLogo;
    });
    if (!img.complete || img.naturalWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// ========== MAIN COVER PAGE ==========
async function addCoverPage(doc: jsPDF, dateRange: DateRange) {
  const logo = await loadLogo();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 150, "F");

  doc.setFillColor(...GOLD);
  doc.rect(0, 150, 210, 5, "F");

  if (logo) doc.addImage(logo, "PNG", 75, 20, 60, 60);

  doc.setFontSize(30);
  doc.setTextColor(...WHITE);
  doc.text("DUNWELL YOUTH", 105, 100, { align: "center" });
  doc.text("PRIORITY CLINIC", 105, 114, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(...GOLD);
  doc.text("COMPREHENSIVE REPORTS", 105, 132, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text("Report Period", 105, 175, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(...GREY);
  doc.text(formatDateRange(dateRange), 105, 186, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`, 105, 198, { align: "center" });

  doc.setFillColor(...LIGHT_GREY);
  doc.roundedRect(30, 215, 150, 48, 4, 4, "F");

  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text("Table of Contents", 105, 228, { align: "center" });
  drawGoldAccent(doc, 232);
  doc.setDrawColor(...GOLD);
  doc.line(160, 232, 196 - 14, 232);

  const sections = [
    ["Section 1", "Patient Demographics & Registration Analysis"],
    ["Section 2", "Appointment & Service Utilisation Report"],
    ["Section 3", "Financial Performance & Revenue Analysis"],
  ];
  doc.setFontSize(9);
  sections.forEach(([num, title], i) => {
    const sy = 240 + i * 7;
    doc.setTextColor(...NAVY);
    doc.text(num, 38, sy);
    doc.setTextColor(...GREY);
    doc.text(title, 62, sy);
  });

  drawGoldAccent(doc, 276, 182);
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("Confidential — For internal use only", 105, 284, { align: "center" });
}

// ========== SECTION DIVIDER PAGE ==========
async function addSectionDivider(doc: jsPDF, sectionNumber: number, title: string, subtitle: string, dateRange: DateRange) {
  const logo = await loadLogo();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 70, 297, "F");

  doc.setFillColor(...GOLD);
  doc.rect(70, 0, 4, 297, "F");

  doc.setFontSize(72);
  doc.setTextColor(...GOLD);
  doc.text(String(sectionNumber), 35, 130, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text("SECTION", 35, 145, { align: "center" });

  if (logo) doc.addImage(logo, "PNG", 130, 30, 40, 40);

  doc.setFontSize(26);
  doc.setTextColor(...NAVY);
  doc.text(title, 85, 110);

  drawGoldAccent(doc, 118);
  doc.setDrawColor(...GOLD);
  doc.line(14, 118, 190, 118);

  doc.setFontSize(11);
  doc.setTextColor(...GREY);
  const splitSubtitle = doc.splitTextToSize(subtitle, 110);
  doc.text(splitSubtitle, 85, 128);

  doc.setFillColor(...LIGHT_GREY);
  doc.roundedRect(85, 160, 105, 24, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("Reporting Period", 90, 170);
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(formatDateRange(dateRange), 90, 178);

  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("Dunwell Youth Priority Clinic — Confidential Report", 140, 284, { align: "center" });
}

// ========== PAGE HEADER ==========
async function addPageHeader(doc: jsPDF, sectionNum: number, title: string, dateRange: DateRange): Promise<number> {
  const logo = await loadLogo();
  if (logo) doc.addImage(logo, "PNG", 14, 8, 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("Dunwell Youth Priority Clinic", 32, 15);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(`Section ${sectionNum} — ${title}`, 32, 21);

  doc.setFontSize(7);
  doc.text(`Period: ${formatDateRange(dateRange)}`, 150, 15);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}`, 150, 21);

  drawHR(doc, 26);
  return 34;
}

// ========== ANALYSIS BOX ==========
function addAnalysisBox(doc: jsPDF, title: string, lines: string[], startY: number): number {
  if (startY > 240) { doc.addPage(); startY = 20; }

  const boxHeight = 12 + lines.length * 6;
  doc.setFillColor(...LIGHT_GREY);
  doc.roundedRect(14, startY, 182, boxHeight, 3, 3, "F");
  doc.setFillColor(...GOLD);
  doc.rect(14, startY, 3, boxHeight, "F");

  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(title, 22, startY + 8);

  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  let y = startY + 16;
  lines.forEach(line => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(`•  ${line}`, 22, y);
    y += 6;
  });
  return y + 6;
}

// ========== MINI BAR CHART ==========
function drawMiniBarChart(doc: jsPDF, data: { label: string; value: number }[], startY: number, title: string, valuePrefix = ""): number {
  if (startY > 220) { doc.addPage(); startY = 20; }

  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(title, 14, startY);
  startY += 6;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barMaxWidth = 95;
  const barHeight = 7;
  const gap = 3;

  data.forEach((item, i) => {
    const y = startY + i * (barHeight + gap);
    if (y > 268) return;

    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    const label = item.label.length > 18 ? item.label.substring(0, 17) + "…" : item.label;
    doc.text(label, 14, y + 5);

    doc.setFillColor(230, 232, 236);
    doc.roundedRect(72, y, barMaxWidth, barHeight, 1.5, 1.5, "F");

    const barWidth = Math.max(2, (item.value / maxVal) * barMaxWidth);
    doc.setFillColor(...(i % 2 === 1 ? GOLD : NAVY));
    doc.roundedRect(72, y, barWidth, barHeight, 1.5, 1.5, "F");

    doc.setFontSize(7.5);
    doc.setTextColor(...NAVY);
    doc.text(`${valuePrefix}${item.value.toLocaleString()}`, 72 + barWidth + 3, y + 5);
  });

  return startY + data.length * (barHeight + gap) + 6;
}

// ========== KEY METRICS BOX ==========
function drawMetricsRow(doc: jsPDF, metrics: { label: string; value: string }[], startY: number): number {
  if (startY > 250) { doc.addPage(); startY = 20; }

  const colWidth = 182 / metrics.length;
  metrics.forEach((m, i) => {
    const x = 14 + i * colWidth;
    doc.setFillColor(i === 0 ? NAVY[0] : LIGHT_GREY[0], i === 0 ? NAVY[1] : LIGHT_GREY[1], i === 0 ? NAVY[2] : LIGHT_GREY[2]);
    doc.roundedRect(x + 1, startY, colWidth - 2, 18, 2, 2, "F");

    doc.setFontSize(7.5);
    const labelColor = i === 0 ? GOLD : GREY;
    doc.setTextColor(...labelColor);
    doc.text(m.label, x + colWidth / 2, startY + 7, { align: "center" });
    doc.setFontSize(11);
    const valueColor = i === 0 ? WHITE : NAVY;
    doc.setTextColor(...valueColor);
    doc.text(m.value, x + colWidth / 2, startY + 15, { align: "center" });
  });

  return startY + 24;
}

// ========== PATIENT SECTION ==========
async function generatePatientSection(doc: jsPDF, dateRange: DateRange, data: PDFData, sectionNum = 1) {
  await addSectionDivider(doc, sectionNum, "Patient Report", "Analysis of new patient registrations, demographic breakdown by gender and age group, and registration trends over the reporting period.", dateRange);

  doc.addPage();
  let y = await addPageHeader(doc, sectionNum, "Patient Report", dateRange);

  const filtered = data.patients;

  const genderCounts: Record<string, number> = {};
  filtered.forEach(p => { genderCounts[p.Gender] = (genderCounts[p.Gender] || 0) + 1; });

  const ageGroups: Record<string, number> = { "0-17": 0, "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 };
  filtered.forEach(p => {
    const age = Math.floor((Date.now() - new Date(p.DOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) ageGroups["0-17"]++;
    else if (age <= 25) ageGroups["18-25"]++;
    else if (age <= 35) ageGroups["26-35"]++;
    else if (age <= 45) ageGroups["36-45"]++;
    else ageGroups["46+"]++;
  });

  y = drawMetricsRow(doc, [
    { label: "Total New Patients", value: String(filtered.length) },
    ...Object.entries(genderCounts).map(([g, c]) => ({ label: g, value: `${c} (${((c / Math.max(filtered.length, 1)) * 100).toFixed(0)}%)` })),
  ], y);

  y = drawMiniBarChart(doc, Object.entries(ageGroups).map(([label, value]) => ({ label, value })), y, "Age Group Distribution");

  autoTable(doc, {
    startY: y,
    head: [["Age Group", "Count", "Percentage"]],
    body: Object.entries(ageGroups).map(([g, c]) => [g, String(c), `${filtered.length ? ((c / filtered.length) * 100).toFixed(1) : 0}%`]),
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Gender", "Count", "Percentage"]],
    body: Object.entries(genderCounts).map(([g, c]) => [g, String(c), `${((c / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`]),
    headStyles: { fillColor: GOLD as any, textColor: NAVY as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 250, 235] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const topAge = Object.entries(ageGroups).sort((a, b) => b[1] - a[1])[0];
  const lowAge = Object.entries(ageGroups).sort((a, b) => a[1] - b[1])[0];
  const topGender = Object.entries(genderCounts).sort((a, b) => b[1] - a[1])[0];
  const byDate: Record<string, number> = {};
  filtered.forEach(p => { byDate[p.CreatedDate] = (byDate[p.CreatedDate] || 0) + 1; });
  const dateData = Object.entries(byDate).sort();
  addAnalysisBox(doc, "Key Findings — Patient Demographics", [
    `A total of ${filtered.length} new patients were registered during this reporting period.`,
    topGender ? `${topGender[0]} patients represent the majority at ${topGender[1]} (${((topGender[1] / Math.max(filtered.length, 1)) * 100).toFixed(1)}%).` : "",
    `The ${topAge[0]} age group had the highest registration count with ${topAge[1]} patients.`,
    `The ${lowAge[0]} age group had the lowest registration count with ${lowAge[1]} patients.`,
    filtered.length > 10 ? `Average of ${(filtered.length / Math.max(dateData.length, 1)).toFixed(1)} registrations per active registration day.` : "",
  ].filter(Boolean), y);
}

// ========== APPOINTMENT SECTION ==========
async function generateAppointmentSection(doc: jsPDF, dateRange: DateRange, data: PDFData, sectionNum = 2) {
  await addSectionDivider(doc, sectionNum, "Appointment Report", "Overview of appointment volumes, service utilisation frequency, university student participation, and payment method distribution across the reporting period.", dateRange);

  doc.addPage();
  let y = await addPageHeader(doc, sectionNum, "Appointment Report", dateRange);

  const filtered = data.appointments;
  const students = filtered.filter(a => a.IsStudent).length;
  const followUps = filtered.filter(a => a.isFollow_Up).length;
  const completed = filtered.filter(a => a.Status === "Completed").length;
  const cancelled = filtered.filter(a => a.Status === "Cancelled").length;
  const noShow = filtered.filter(a => a.Status === "No Show").length;

  const serviceCounts: Record<string, number> = {};
  filtered.forEach(a => { serviceCounts[a.ServiceName] = (serviceCounts[a.ServiceName] || 0) + 1; });
  const paymentCounts: Record<string, number> = {};
  filtered.forEach(a => { paymentCounts[a.PaymentMethod] = (paymentCounts[a.PaymentMethod] || 0) + 1; });

  y = drawMetricsRow(doc, [
    { label: "Total Appointments", value: String(filtered.length) },
    { label: "Student Appointments", value: `${students} (${((students / Math.max(filtered.length, 1)) * 100).toFixed(0)}%)` },
    { label: "Follow-Up Visits", value: `${followUps} (${((followUps / Math.max(filtered.length, 1)) * 100).toFixed(0)}%)` },
    { label: "Completed", value: String(completed) },
    { label: "Cancelled / No Show", value: `${cancelled} / ${noShow}` },
  ], y);

  const serviceData = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  y = drawMiniBarChart(doc, serviceData, y, "Service Utilisation Frequency");

  autoTable(doc, {
    startY: y,
    head: [["Service Name", "Appointments", "% of Total", "Rank"]],
    body: Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).map(([s, c], i) => [s, String(c), `${((c / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`, `#${i + 1}`]),
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Payment Method", "Count", "% of Total"]],
    body: Object.entries(paymentCounts).sort((a, b) => b[1] - a[1]).map(([m, c]) => [m, String(c), `${((c / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`]),
    headStyles: { fillColor: GOLD as any, textColor: NAVY as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 250, 235] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Status", "Count", "% of Total"]],
    body: [
      ["Completed", String(completed), `${((completed / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`],
      ["Cancelled", String(cancelled), `${((cancelled / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`],
      ["No Show", String(noShow), `${((noShow / Math.max(filtered.length, 1)) * 100).toFixed(1)}%`],
    ],
    headStyles: { fillColor: [70, 85, 110], textColor: WHITE as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  const bottomService = topService[topService.length - 1];
  const topPayment = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0];
  addAnalysisBox(doc, "Key Findings — Appointments & Services", [
    `${topService[0][0]} was the most utilised service with ${topService[0][1]} appointments (${((topService[0][1] / Math.max(filtered.length, 1)) * 100).toFixed(1)}%).`,
    `${bottomService[0]} had the lowest utilisation with ${bottomService[1]} appointments.`,
    `Completion rate: ${((completed / Math.max(filtered.length, 1)) * 100).toFixed(1)}% — Cancellation rate: ${((cancelled / Math.max(filtered.length, 1)) * 100).toFixed(1)}%.`,
    `${students} (${((students / Math.max(filtered.length, 1)) * 100).toFixed(1)}%) of appointments were from Uni/Wits students.`,
    `${followUps} (${((followUps / Math.max(filtered.length, 1)) * 100).toFixed(1)}%) were follow-up visits, indicating patient continuity of care.`,
    `Most used payment method: ${topPayment[0]} with ${topPayment[1]} transactions.`,
  ], y);
}

async function generateFinancialSection(
  doc: jsPDF,
  dateRange: DateRange,
  timeRangeType: TimeRange,
  data: PDFData,
  sectionNum = 3
) {
  await addSectionDivider(
    doc,
    sectionNum,
    "Financial Report",
    "Comprehensive revenue analysis including service-level revenue breakdown, payment method distribution, medical aid utilisation, and period-over-period performance indicators.",
    dateRange
  );

  doc.addPage();
  let y = await addPageHeader(doc, sectionNum, "Financial Report", dateRange);

  // Use all appointments; fallback to ServicePrice if FinalPrice missing
  const filtered = data.appointments.filter(a => a.Status !== "Cancelled" && a.Status !== "No Show");
  const totalRevenue = filtered.reduce((sum, a) => sum + (parseFloat(a.FinalPrice ?? a.ServicePrice) || 0), 0);

  // Revenue by Service
  const revByService: Record<string, number> = {};
  filtered.forEach(a => {
    const price = parseFloat(a.FinalPrice ?? a.ServicePrice) || 0;
    const service = a.ServiceName || "Unknown";
    revByService[service] = (revByService[service] || 0) + price;
  });

  // Revenue by Payment Method
  const revByPayment: Record<string, number> = {};
  filtered.forEach(a => {
    const price = parseFloat(a.FinalPrice ?? a.ServicePrice) || 0;
    const payment = (a.PaymentMethod || "UNKNOWN").toUpperCase();
    revByPayment[payment] = (revByPayment[payment] || 0) + price;
  });

  // Counts per payment method
  const cashCount = filtered.filter(a => (a.PaymentMethod || "").toUpperCase() === "CASH").length;
  const cardCount = filtered.filter(a => (a.PaymentMethod || "").toUpperCase() === "CARD").length;
  const medAidCount = filtered.filter(a => (a.PaymentMethod || "").toUpperCase() === "MEDICAL-AID").length;

  // Total Revenue Box
  doc.setFillColor(...NAVY);
  doc.roundedRect(14, y, 182, 20, 3, 3, "F");
  doc.setFontSize(13);
  doc.setTextColor(...GOLD);
  doc.text(`Total Revenue: R ${Math.round(totalRevenue).toLocaleString()}`, 105, y + 13, { align: "center" });
  y += 26;

  // Metrics Row
  y = drawMetricsRow(
    doc,
    [
      { label: "Cash Appointments", value: String(cashCount) },
      { label: "Credit Card", value: String(cardCount) },
      { label: "Medical Aid", value: String(medAidCount) },
    ],
    y
  );

  // Revenue by Service Mini Bar
  const serviceRevData = Object.entries(revByService)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value: Math.round(value) }));
  y = drawMiniBarChart(doc, serviceRevData, y, "Revenue by Service", "R ");

  // Revenue Tables (Services & Payment Methods)
  autoTable(doc, {
    startY: y,
    head: [["Service", "Revenue (R)", "% of Revenue", "Appointments"]],
    body: Object.entries(revByService)
      .sort((a, b) => b[1] - a[1])
      .map(([s, r]) => [
        s,
        `R ${Math.round(r).toLocaleString()}`,
        `${((r / Math.max(totalRevenue, 1)) * 100).toFixed(1)}%`,
        String(filtered.filter(a => (a.ServiceName || "Unknown") === s).length),
      ]),
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["Payment Method", "Revenue (R)", "% of Revenue", "Appointments"]],
    body: Object.entries(revByPayment)
      .sort((a, b) => b[1] - a[1])
      .map(([m, r]) => [
        m,
        `R ${Math.round(r).toLocaleString()}`,
        `${((r / Math.max(totalRevenue, 1)) * 100).toFixed(1)}%`,
        String(filtered.filter(a => ((a.PaymentMethod || "UNKNOWN").toUpperCase() === m)).length),
      ]),
    headStyles: { fillColor: GOLD as any, textColor: NAVY as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 250, 235] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Medical Aid Utilisation
  const medAidCounts: Record<string, number> = {};
  filtered
    .filter(a => (a.PaymentMethod || "").toUpperCase() === "MEDICAL-AID" && a.MedicalAidName)
    .forEach(a => {
      medAidCounts[a.MedicalAidName!] = (medAidCounts[a.MedicalAidName!] || 0) + 1;
    });

  if (Object.keys(medAidCounts).length) {
    if (y > 220) {
      doc.addPage();
      y = await addPageHeader(doc, sectionNum, "Financial Report", dateRange);
    }

    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text("Medical Aid Utilisation", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Medical Aid Provider", "Times Used", "% of Medical Aid"]],
      body: Object.entries(medAidCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([m, c]) => [m, String(c), `${((c / Math.max(medAidCount, 1)) * 100).toFixed(1)}%`]),
      headStyles: { fillColor: [70, 85, 110], textColor: WHITE as any, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { fontSize: 8.5, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
  }
}
// ========== REGISTER SECTION ==========
async function generateRegisterSection(doc: jsPDF, dateRange: DateRange, data: PDFData, sectionNum = 4) {
  await addSectionDivider(doc, sectionNum, "Employee Register", "Summary of employee attendance, total hours worked, leave days taken, and workforce availability during the reporting period.", dateRange);

  doc.addPage();
  let y = await addPageHeader(doc, sectionNum, "Employee Register", dateRange);

  const filtered = data.register;

  const empData = data.users.map(u => {
    const entries = filtered.filter(r => r.UserID === u.UserID);
    return {
      name: `${u.Name} ${u.Surname}`,
      hours: Math.round(entries.reduce((s, r) => s + (r.HoursWorked || 0), 0) * 10) / 10,
      present: entries.filter(r => !r.OnLeave).length,
      off: entries.filter(r => r.OnLeave).length,
      avgHours: entries.filter(r => !r.OnLeave).length > 0
        ? Math.round((entries.reduce((s, r) => s + (r.HoursWorked || 0), 0) / entries.filter(r => !r.OnLeave).length) * 10) / 10
        : 0,
    };
  });

  const totalHours = empData.reduce((s, e) => s + e.hours, 0);
  const totalPresent = empData.reduce((s, e) => s + e.present, 0);
  const totalOff = empData.reduce((s, e) => s + e.off, 0);

  y = drawMetricsRow(doc, [
    { label: "Total Hours Worked", value: String(Math.round(totalHours)) },
    { label: "Total Days Present", value: String(totalPresent) },
    { label: "Total Days Off", value: String(totalOff) },
    { label: "Attendance Rate", value: `${((totalPresent / Math.max(totalPresent + totalOff, 1)) * 100).toFixed(1)}%` },
  ], y);

  y = drawMiniBarChart(doc, empData.map(e => ({ label: e.name, value: e.hours })), y, "Hours Worked by Employee");

  autoTable(doc, {
    startY: y,
    head: [["Employee", "Total Hours", "Avg Hours/Day", "Days Present", "Days Off", "Attendance %"]],
    body: empData.map(e => [
      e.name,
      String(e.hours),
      String(e.avgHours),
      String(e.present),
      String(e.off),
      `${((e.present / Math.max(e.present + e.off, 1)) * 100).toFixed(1)}%`,
    ]),
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [["", "Total Hours", "Avg/Employee", "Total Present", "Total Off", "Overall Rate"]],
    body: [[
      "TEAM TOTAL",
      String(Math.round(totalHours)),
      String(Math.round(totalHours / Math.max(empData.length, 1))),
      String(totalPresent),
      String(totalOff),
      `${((totalPresent / Math.max(totalPresent + totalOff, 1)) * 100).toFixed(1)}%`,
    ]],
    headStyles: { fillColor: GOLD as any, textColor: NAVY as any, fontStyle: "bold" },
    bodyStyles: { fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const mostHours = [...empData].sort((a, b) => b.hours - a.hours)[0];
  const leastHours = [...empData].sort((a, b) => a.hours - b.hours)[0];
  const mostOff = [...empData].sort((a, b) => b.off - a.off)[0];
  addAnalysisBox(doc, "Key Findings — Employee Attendance", [
    `${mostHours.name} logged the highest hours at ${mostHours.hours} hours (${mostHours.avgHours} hrs/day average).`,
    `${leastHours.name} logged the fewest hours at ${leastHours.hours} hours.`,
    `${mostOff.name} took the most leave days (${mostOff.off} days off).`,
    `Overall team attendance rate: ${((totalPresent / Math.max(totalPresent + totalOff, 1)) * 100).toFixed(1)}%.`,
    `Total workforce output: ${Math.round(totalHours)} hours across ${empData.length} employees.`,
  ], y);
}

// ========== PAYROLL SECTION (full report style) ==========
async function generatePayrollSection(doc: jsPDF, dateRange: DateRange, data: PDFData, sectionNum = 4) {
  const monthLabel = dateRange.start.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  await addSectionDivider(doc, sectionNum, "Payroll Report", `Monthly payroll summary for ${monthLabel}, including employee bank details, positions, employment status, and salary breakdown.`, dateRange);

  doc.addPage();
  let y = await addPageHeader(doc, sectionNum, "Payroll Report", dateRange);

  const items: any[] = data.payroll || [];

  const permanentCount = items.filter(i => i.Status === "Permanent").length;
  const locumCount = items.filter(i => i.Status !== "Permanent").length;
  const totalSalary = items.reduce((sum, i) => sum + parseFloat(i.Salary || 0), 0);
  const avgSalary = items.length ? Math.round(totalSalary / items.length) : 0;

  y = drawMetricsRow(doc, [
    { label: "Total Employees", value: String(items.length) },
    { label: "Permanent", value: String(permanentCount) },
    { label: "Locum / Other", value: String(locumCount) },
    { label: "Total Payroll", value: `R ${Math.round(totalSalary).toLocaleString()}` },
    { label: "Avg Salary", value: `R ${avgSalary.toLocaleString()}` },
  ], y);

  // Month header box
  doc.setFillColor(...NAVY);
  doc.roundedRect(14, y, 182, 14, 3, 3, "F");
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text(monthLabel.toUpperCase(), 105, y + 10, { align: "center" });
  y += 20;

  // Main payroll table
  autoTable(doc, {
    startY: y,
    head: [["Full Name", "Bank", "Position", "Account Number", "Status", "Salary"]],
    body: items.map((item: any) => [
      item.FullName,
      item.Bank,
      item.Position,
      item.AccountNumber,
      item.Status,
      `R ${parseFloat(item.Salary).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`,
    ]),
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: { 5: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // Total row
  autoTable(doc, {
    startY: y,
    head: [["", "", "", "", "TOTAL PAYROLL", `R ${Math.round(totalSalary).toLocaleString()}`]],
    body: [],
    headStyles: { fillColor: GOLD as any, textColor: NAVY as any, fontStyle: "bold" },
    columnStyles: { 5: { halign: "right" } },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (items.length > 0) {
    const highest = [...items].sort((a, b) => parseFloat(b.Salary) - parseFloat(a.Salary))[0];
    const lowest = [...items].sort((a, b) => parseFloat(a.Salary) - parseFloat(b.Salary))[0];
    addAnalysisBox(doc, "Key Findings — Payroll", [
      `${items.length} employees on payroll for ${monthLabel}.`,
      `${permanentCount} permanent employee${permanentCount !== 1 ? "s" : ""} and ${locumCount} locum/other employee${locumCount !== 1 ? "s" : ""}.`,
      `Highest salary: ${highest.FullName} (${highest.Position}) — R ${parseFloat(highest.Salary).toLocaleString()}.`,
      `Lowest salary: ${lowest.FullName} (${lowest.Position}) — R ${parseFloat(lowest.Salary).toLocaleString()}.`,
      `Total monthly payroll liability: R ${Math.round(totalSalary).toLocaleString()} (avg R ${avgSalary.toLocaleString()} per employee).`,
    ], y);
  }
}

// ========== PAYROLL PDF (matches the clinic payroll format) ==========
export async function generatePayrollPDF(items: any[], monthLabel: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  const logo = await loadLogo();

  const pageW = doc.internal.pageSize.getWidth();

  // Header area
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 40, "F");

  if (logo) doc.addImage(logo, "PNG", 10, 5, 28, 28);

  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text("DUNWELL YOUTH PRIORITY CLINIC", pageW / 2, 17, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(...GOLD);
  doc.text("PAYROLL REPORT", pageW / 2, 27, { align: "center" });

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(0, 40, pageW, 3, "F");

  // Month label
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text(monthLabel.toUpperCase(), pageW / 2, 54, { align: "center" });

  // Underline the month
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  const textWidth = doc.getTextWidth(monthLabel.toUpperCase());
  doc.line(pageW / 2 - textWidth / 2, 56, pageW / 2 + textWidth / 2, 56);

  // Payroll table
  autoTable(doc, {
    startY: 62,
    head: [["Full Name", "Bank", "Position", "Account Number", "Status", "Salary"]],
    body: items.map((item: any) => [
      item.FullName,
      item.Bank,
      item.Position,
      item.AccountNumber,
      item.Status,
      `R ${parseFloat(item.Salary).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`,
    ]),
    headStyles: {
      fillColor: NAVY as any,
      textColor: WHITE as any,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9.5,
      cellPadding: 5,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 65 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
      5: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    tableLineColor: [200, 205, 215] as any,
    tableLineWidth: 0.2,
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Total row
  const total = items.reduce((sum: number, i: any) => sum + parseFloat(i.Salary || 0), 0);
  const totalText = `TOTAL PAYROLL:   R ${total.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
  doc.setFillColor(...LIGHT_GREY);
  doc.roundedRect(14, finalY + 4, pageW - 28, 12, 2, 2, "F");
  doc.setFillColor(...GOLD);
  doc.rect(14, finalY + 4, 3, 12, "F");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(totalText, pageW - 18, finalY + 13, { align: "right" });

  // Footer
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(14, doc.internal.pageSize.getHeight() - 12, pageW - 14, doc.internal.pageSize.getHeight() - 12);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text("Dunwell Youth Priority Clinic — Confidential Payroll Document", 14, doc.internal.pageSize.getHeight() - 7);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}`, pageW - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });

  doc.save(`Dunwell_Payroll_${monthLabel.replace(" ", "_")}.pdf`);
}

// ========== FOOTER ON ALL PAGES ==========
function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text("Dunwell Youth Priority Clinic — Confidential Report", 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
  }
}

// ========== EXPORTS ==========

export async function generateSectionPDF(section: string, dateRange: DateRange, timeRangeType: TimeRange, data: PDFData) {
  const doc = new jsPDF();

  switch (section) {
    case "patients": await generatePatientSection(doc, dateRange, data); break;
    case "appointments": await generateAppointmentSection(doc, dateRange, data); break;
    case "financial": await generateFinancialSection(doc, dateRange, timeRangeType, data); break;
  }

  addFooters(doc);
  doc.save(`Dunwell_${section}_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function generateFullReport(dateRange: DateRange, timeRangeType: TimeRange, data: PDFData) {
  const doc = new jsPDF();

  await addCoverPage(doc, dateRange);
  doc.addPage();
  await generatePatientSection(doc, dateRange, data, 1);
  doc.addPage();
  await generateAppointmentSection(doc, dateRange, data, 2);
  doc.addPage();
  await generateFinancialSection(doc, dateRange, timeRangeType, data, 3);

  addFooters(doc);
  doc.save(`Dunwell_Full_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}
