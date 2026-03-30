import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { X, Download, RotateCcw, PenLine, Maximize2, Minimize2, CheckCircle2 } from "lucide-react";

interface Patient {
  PatientName: string;
  PatientSurname: string;
  DOB?: string;
  Patient_ContactNo?: string;
}

interface ConsentFormModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (signatureDataUrl: string) => void;
  patient: Patient | null;
}

const CONSENT_TEXT = [
  {
    title: "1. CONSENT TO TREATMENT",
    body: "I consent to receive medical examination, diagnosis, treatment, and healthcare services as deemed necessary by the healthcare practitioners at Dunwell Youth Priority Clinic. This includes physical examinations, laboratory tests, medications, and other appropriate clinical procedures.",
  },
  {
    title: "2. VOLUNTARY PARTICIPATION",
    body: "I acknowledge that my participation in treatment is voluntary. I have the right to refuse or withdraw consent to any specific treatment at any time, and I understand the potential consequences of such refusal.",
  },
  {
    title: "3. CONFIDENTIALITY & POPIA",
    body: "My personal and medical information will be kept strictly confidential in accordance with the Protection of Personal Information Act (POPIA) and applicable South African law. My information will only be disclosed to authorised healthcare providers involved in my care.",
  },
  {
    title: "4. MEDICAL AID & PAYMENT",
    body: "I authorise Dunwell Youth Priority Clinic to process payment claims with my medical aid scheme (if applicable) and acknowledge my responsibility for any co-payments or services not covered by my medical aid.",
  },
  {
    title: "5. EMERGENCY TREATMENT",
    body: "I consent to emergency medical treatment being administered in the event that I am unable to provide consent at the time of an emergency.",
  },
  {
    title: "6. PATIENT RIGHTS",
    body: "I have been informed of my rights as a patient, including the right to receive quality healthcare, to be treated with dignity and respect, and to receive information about my condition and treatment options.",
  },
  {
    title: "7. COMMUNICATION",
    body: "I consent to receive necessary communications regarding my healthcare from Dunwell Youth Priority Clinic via the contact details provided.",
  },
];

export default function ConsentFormModal({ open, onClose, onAccept, patient }: ConsentFormModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [sigFullscreen, setSigFullscreen] = useState(false);
  const [fsIsDrawing, setFsIsDrawing] = useState(false);
  const [fsLastPos, setFsLastPos] = useState({ x: 0, y: 0 });
  const [fsHasSigned, setFsHasSigned] = useState(false);

  // Load logo once
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch("/clinic-logo.jpeg");
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      } catch {
        // logo load failed — continue without it
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    if (!open) return;
    setHasSigned(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [open]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setLastPos(getPos(e, canvas));
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setLastPos(pos);
      setHasSigned(true);
    },
    [isDrawing, lastPos]
  );

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // ── Full-screen signature handlers ─────────────────────────────────────────
  useEffect(() => {
    if (!sigFullscreen) return;
    // Wait one frame so the canvas has its final layout size before reading it
    const timer = requestAnimationFrame(() => {
      setFsHasSigned(false);
      const canvas = fsCanvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      // Set internal resolution = displayed size × device pixel ratio → no pixelation
      canvas.width  = Math.round(rect.width  * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    return () => cancelAnimationFrame(timer);
  }, [sigFullscreen]);

  const clearFsSignature = () => {
    const canvas = fsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setFsHasSigned(false);
  };

  const startFsDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = fsCanvasRef.current;
    if (!canvas) return;
    setFsIsDrawing(true);
    setFsLastPos(getPos(e, canvas));
  }, []);

  const drawFs = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!fsIsDrawing) return;
      const canvas = fsCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e, canvas);
      // Scale lineWidth by DPR so strokes are visually ~3px regardless of screen density
      const dpr = window.devicePixelRatio || 1;
      ctx.beginPath();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 3 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(fsLastPos.x, fsLastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setFsLastPos(pos);
      setFsHasSigned(true);
    },
    [fsIsDrawing, fsLastPos]
  );

  const stopFsDrawing = useCallback(() => setFsIsDrawing(false), []);

  const handleFsDone = () => {
    const fsCanvas = fsCanvasRef.current;
    const mainCanvas = canvasRef.current;
    if (!fsCanvas || !mainCanvas) return;
    const ctx = mainCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.drawImage(fsCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
    setHasSigned(fsHasSigned);
    setSigFullscreen(false);
  };

  const formatDOB = (dob?: string) => (dob ? dob.split("T")[0] : "");

  const todayStr = new Date().toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const generatePDF = (signatureDataUrl?: string) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const M = 16;                         // margin
    const CW = W - M * 2;                 // content width

    // ── Colour palette ────────────────────────────────────────────────────────
    const navy   = [0,   32,  80]  as const;   // #002050
    const teal   = [0,  140, 160]  as const;   // accent
    const slate  = [55,  65,  81]  as const;   // dark text
    const muted  = [107, 114, 128] as const;   // muted text
    const light  = [243, 246, 252] as const;   // section bg
    const white  = [255, 255, 255] as const;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fill  = (r: number, g: number, b: number) => doc.setFillColor(r, g, b);
    const draw  = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b);
    const color = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);
    let y = 0;

    // ════════════════════════════════════════════════════════════════════════
    // HEADER — full-width navy background
    // ════════════════════════════════════════════════════════════════════════
    const headerH = 40;
    fill(...navy); doc.rect(0, 0, W, headerH, "F");

    // Teal left accent strip
    fill(...teal); doc.rect(0, 0, 4, headerH, "F");

    // Logo (left side, centred vertically in header)
    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 8, 5, 27, 27);
    }

    // Clinic name + contact (right of logo or left if no logo)
    const tx = logoBase64 ? 40 : M;
    color(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14.5);
    doc.text("DUNWELL Youth Priority Clinic", tx, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    color(170, 200, 230);
    doc.text("38 De Beer Street, Braamfontein, Johannesburg, 2001", tx, 21);
    doc.text("Tel: 072 176 0247   |   Email: admin@dunwellyouthpriority.co.za", tx, 27);

    // "CONFIDENTIAL MEDICAL RECORD" badge top-right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    color(140, 200, 255);
    doc.text("CONFIDENTIAL MEDICAL RECORD", W - M, 11, { align: "right" });

    // Thin teal rule at bottom of header
    fill(...teal); doc.rect(0, headerH, W, 1.5, "F");

    y = headerH + 1.5;

    // ════════════════════════════════════════════════════════════════════════
    // DOCUMENT TITLE BANNER
    // ════════════════════════════════════════════════════════════════════════
    fill(...light); doc.rect(0, y, W, 11, "F");
    color(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PATIENT CONSENT FORM", W / 2, y + 7.5, { align: "center" });
    // small dot separators either side
    color(...teal);
    doc.setFontSize(9);
    doc.text("• • •", W / 2, y + 3.5, { align: "center" });

    y += 14;

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT DETAILS CARD
    // ════════════════════════════════════════════════════════════════════════
    const fullName = patient ? `${patient.PatientName} ${patient.PatientSurname}` : "";
    const dob      = patient ? formatDOB(patient.DOB) : "";
    const contact  = patient ? (patient.Patient_ContactNo || "") : "";
    const cardH    = 35;

    // Card shadow effect (offset rect)
    fill(220, 225, 235); doc.roundedRect(M + 0.8, y + 0.8, CW, cardH, 2, 2, "F");
    // Card body
    fill(255, 255, 255);
    draw(...navy); doc.setLineWidth(0.15);
    doc.roundedRect(M, y, CW, cardH, 2, 2, "FD");
    // Card header strip
    fill(...navy); doc.roundedRect(M, y, CW, 8, 2, 2, "F");
    fill(...navy); doc.rect(M, y + 4, CW, 4, "F");  // square off bottom of strip

    // Left accent in strip
    fill(...teal); doc.rect(M, y, 3, 8, "F");

    color(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("PATIENT DETAILS", M + 6, y + 5.3);

    const c1 = M + 5;
    const c2 = M + CW / 2 + 4;
    const r1 = y + 16;
    const r2 = y + 26;

    const detailPair = (label: string, value: string, lx: number, ly: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      color(...muted);
      doc.text(label.toUpperCase(), lx, ly - 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      color(...slate);
      doc.text(value || "—", lx, ly);
    };

    detailPair("Full Name",    fullName,  c1, r1);
    detailPair("Date of Birth", dob,      c2, r1);
    detailPair("Contact No.",  contact,   c1, r2);
    detailPair("Date",         todayStr,  c2, r2);

    y += cardH + 8;

    // ════════════════════════════════════════════════════════════════════════
    // INTRO TEXT
    // ════════════════════════════════════════════════════════════════════════
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    color(90, 100, 115);
    const introLines = doc.splitTextToSize(
      "By signing this form, I confirm that I have read, understood, and voluntarily agree to all the terms set out below:",
      CW
    );
    doc.text(introLines, M, y);
    y += introLines.length * 4 + 4;

    // ════════════════════════════════════════════════════════════════════════
    // CONSENT SECTIONS
    // ════════════════════════════════════════════════════════════════════════
    CONSENT_TEXT.forEach((section, idx) => {
      const bodyLines = doc.splitTextToSize(section.body, CW - 8);
      const sH = 7 + bodyLines.length * 3.8 + 5;

      // Alternating background
      if (idx % 2 === 0) {
        fill(...light); doc.rect(M, y, CW, sH, "F");
      } else {
        fill(255, 255, 255); doc.rect(M, y, CW, sH, "F");
      }

      // Left accent bar
      fill(...teal); doc.rect(M, y, 2.5, sH, "F");

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      color(...navy);
      doc.text(section.title, M + 6, y + 5.5);

      // Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      color(...slate);
      doc.text(bodyLines, M + 6, y + 10);

      y += sH + 1;
    });

    y += 3;

    // ════════════════════════════════════════════════════════════════════════
    // SIGNATURE SECTION
    // ════════════════════════════════════════════════════════════════════════
    const sigMinY = H - 62;
    if (y < sigMinY) y = sigMinY;

    // Full-width separator
    fill(...teal); doc.rect(M, y, CW, 0.8, "F");
    y += 6;

    // "Signature" heading
    color(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Patient / Guardian Signature", M, y);
    y += 5;

    // Signature box (left ~60%)
    const sigW = Math.round(CW * 0.6);
    const sigH2 = 24;
    fill(252, 253, 255);
    draw(...teal); doc.setLineWidth(0.5);
    doc.roundedRect(M, y, sigW, sigH2, 1.5, 1.5, "FD");

    if (signatureDataUrl) {
      doc.addImage(signatureDataUrl, "PNG", M + 1, y + 1, sigW - 2, sigH2 - 2);
    } else {
      // "Sign here" watermark
      color(200, 210, 225);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Sign here", M + sigW / 2, y + sigH2 / 2 + 1.5, { align: "center" });
    }

    // Date block (right side)
    const dateX = M + sigW + 6;
    const dateW = CW - sigW - 6;
    fill(...light);
    doc.roundedRect(dateX, y, dateW, sigH2, 1.5, 1.5, "F");
    draw(200, 210, 225); doc.setLineWidth(0.3);
    doc.roundedRect(dateX, y, dateW, sigH2, 1.5, 1.5, "S");
    color(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text("DATE", dateX + 4, y + 7);
    color(...slate);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(todayStr, dateX + 4, y + 16);

    y += sigH2 + 5;

    // Acknowledgement
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.3);
    color(120, 130, 145);
    doc.text(
      "I acknowledge that I have read, understood, and voluntarily consent to the terms set out in this document.",
      M,
      y
    );

    // ════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════════════════════════════
    const footerY = H - 12;
    fill(...navy); doc.rect(0, footerY, W, 12, "F");
    fill(...teal); doc.rect(0, footerY, 4, 12, "F");

    const refNum = `CF-DW-${Date.now().toString().slice(-8).toUpperCase()}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    color(150, 180, 220);
    doc.text(`REF: ${refNum}`, M, footerY + 7.5);
    doc.text("CONFIDENTIAL  |  Page 1 of 1", W / 2, footerY + 7.5, { align: "center" });
    doc.text("Dunwell Youth Priority Clinic — Protected by POPIA", W - M, footerY + 7.5, { align: "right" });

    return doc;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const sig = canvas?.toDataURL("image/png");
    const doc = generatePDF(sig);
    const name = patient ? `${patient.PatientName}_${patient.PatientSurname}` : "Patient";
    doc.save(`ConsentForm_${name}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleAccept = () => {
    if (!hasSigned) return;
    const sig = canvasRef.current?.toDataURL("image/png") || "";
    // Auto-download the signed PDF
    const doc = generatePDF(sig);
    const name = patient ? `${patient.PatientName}_${patient.PatientSurname}` : "Patient";
    doc.save(`ConsentForm_${name}_${new Date().toISOString().slice(0, 10)}.pdf`);
    onAccept(sig);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#1a1a2e] text-white shrink-0">
        <div className="flex items-center gap-3">
          <img src="/clinic-logo.jpeg" alt="Dunwell Logo" className="h-10 w-10 rounded-full object-cover border-2 border-white/20" />
          <div>
            <h2 className="text-base font-bold tracking-wide leading-tight">DUNWELL Youth Priority Clinic</h2>
            <p className="text-xs text-blue-200">Patient Consent Form</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-1.5" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto py-8 px-6 space-y-5">

          {/* Patient Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#1a1a2e] px-5 py-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Patient Details</h3>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide block mb-0.5">Full Name</span>
                <span className="text-gray-800 font-medium">{patient ? `${patient.PatientName} ${patient.PatientSurname}` : "—"}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide block mb-0.5">Date of Birth</span>
                <span className="text-gray-800 font-medium">{patient?.DOB ? formatDOB(patient.DOB) : "—"}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide block mb-0.5">Contact No.</span>
                <span className="text-gray-800 font-medium">{patient?.Patient_ContactNo || "—"}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide block mb-0.5">Date</span>
                <span className="text-gray-800 font-medium">{todayStr}</span>
              </div>
            </div>
          </div>

          {/* Consent Text */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#1a1a2e] px-5 py-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Patient Consent</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500 italic mb-4">
                By signing this form, I confirm I have read and understood the following and agree to its terms:
              </p>
              <div className="space-y-4">
                {CONSENT_TEXT.map((section, idx) => (
                  <div key={section.title} className={`rounded-lg p-3 ${idx % 2 === 0 ? "bg-indigo-50/50" : ""}`}>
                    <p className="text-sm font-bold text-[#1a1a2e]">{section.title}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{section.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#1a1a2e] px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-blue-300" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Digital Signature</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={clearSignature} className="text-white/70 hover:text-white hover:bg-white/10 gap-1 h-7 text-xs">
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSigFullscreen(true)} className="text-white/70 hover:text-white hover:bg-white/10 gap-1 h-7 text-xs">
                  <Maximize2 className="h-3 w-3" />
                  Full Screen
                </Button>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-3">
                Sign in the box below, or click <span className="font-semibold text-indigo-600">Full Screen</span> for a larger signing area
              </p>
              <canvas
                ref={canvasRef}
                width={700}
                height={180}
                className="w-full border-2 border-dashed border-indigo-200 rounded-xl bg-white cursor-crosshair touch-none"
                style={{ height: "160px" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSigned && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  ⚠ Please sign above to continue
                </p>
              )}
              {hasSigned && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  ✓ Signature captured
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="shrink-0 px-6 py-4 bg-white border-t flex justify-between items-center gap-4">
        <p className="text-xs text-gray-400">
          Confidential — Dunwell Youth Priority Clinic, 38 De Beer Street, Braamfontein
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAccept} disabled={!hasSigned} className="px-8 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Accept &amp; Download PDF
          </Button>
        </div>
      </div>

      {/* ── Full-screen signature overlay ─────────────────────────────── */}
      {sigFullscreen && (
        <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col overflow-hidden">

          {/* FS Header — always visible, contains all action buttons */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-[#1a1a2e] text-white border-b border-white/10">
            <div className="flex items-center gap-3">
              <PenLine className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-sm font-bold tracking-wide">Patient Signature</p>
                <p className="text-xs text-blue-200/60">
                  {patient ? `${patient.PatientName} ${patient.PatientSurname}` : "Patient"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFsSignature}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5 h-9"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSigFullscreen(false)}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5 h-9"
              >
                <Minimize2 className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-white"
                disabled={!fsHasSigned}
                onClick={handleFsDone}
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </Button>
            </div>
          </div>

          {/* Instruction strip */}
          <div className="shrink-0 flex items-center justify-between px-6 py-2 bg-gray-900 border-b border-white/5">
            <p className="text-gray-400 text-xs">
              Draw your signature in the white area using your mouse, stylus, or finger
            </p>
            {fsHasSigned && (
              <p className="text-green-400 text-xs font-medium flex items-center gap-1">
                ✓ Signature captured — click Done above
              </p>
            )}
            {!fsHasSigned && (
              <p className="text-amber-400/70 text-xs">
                ⚠ Signature required
              </p>
            )}
          </div>

          {/* FS Canvas — fills all remaining height */}
          <div className="flex-1 min-h-0 p-5">
            <div className="w-full h-full relative">
              <canvas
                ref={fsCanvasRef}
                className="w-full h-full rounded-xl bg-white cursor-crosshair touch-none shadow-2xl border-2 border-indigo-400/30"
                onMouseDown={startFsDrawing}
                onMouseMove={drawFs}
                onMouseUp={stopFsDrawing}
                onMouseLeave={stopFsDrawing}
                onTouchStart={startFsDrawing}
                onTouchMove={drawFs}
                onTouchEnd={stopFsDrawing}
              />
              {!fsHasSigned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-300/30 text-5xl font-light italic select-none tracking-widest">
                    Sign here...
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
