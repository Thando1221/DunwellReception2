import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPayroll, addPayrollItem, updatePayrollItem, deletePayrollItem } from "@/lib/api";
import { generatePayrollPDF } from "@/lib/pdfGenerator";
import { DateRange } from "@/lib/mockData";
import { Plus, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayrollReportProps {
  dateRange: DateRange;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const BANKS = ["CAPITEC","TYME BANK","FNB","ABSA","STANDARD BANK","NEDBANK","AFRICAN BANK","INVESTEC","OTHER"];
const STATUSES = ["Permanent","LOCUM","Part-Time","Contract"];

const emptyForm = {
  FullName: "", Bank: "", Position: "", AccountNumber: "", Status: "Permanent", Salary: ""
};

const PayrollReport = ({ dateRange }: PayrollReportProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const month = dateRange.start.getMonth() + 1;
  const year = dateRange.start.getFullYear();
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/payroll", month, year],
    queryFn: () => fetchPayroll(month, year),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [downloading, setDownloading] = useState(false);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      FullName: item.FullName,
      Bank: item.Bank,
      Position: item.Position,
      AccountNumber: item.AccountNumber,
      Status: item.Status,
      Salary: String(item.Salary),
    });
    setDialogOpen(true);
  };

  const addMutation = useMutation({
    mutationFn: (data: any) => addPayrollItem({ ...data, Month: month, Year: year }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll", month, year] });
      setDialogOpen(false);
      toast({ title: "Employee added to payroll" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updatePayrollItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll", month, year] });
      setDialogOpen(false);
      toast({ title: "Payroll record updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePayrollItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll", month, year] });
      setDeleteId(null);
      toast({ title: "Record deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.FullName || !form.Bank || !form.Position || !form.AccountNumber || !form.Status || !form.Salary) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    const payload = { ...form, Salary: parseFloat(form.Salary) };
    if (editItem) {
      updateMutation.mutate({ id: editItem.PayrollID, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      await generatePayrollPDF(items, monthLabel);
    } finally {
      setDownloading(false);
    }
  }, [items, monthLabel]);

  const totalSalary = items.reduce((sum: number, i: any) => sum + parseFloat(i.Salary || 0), 0);
  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5" id="payroll-report">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold font-heading text-foreground">Payroll — {monthLabel}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading || items.length === 0} data-testid="button-download-payroll">
            <Download className="w-4 h-4 mr-1" />
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
          <Button size="sm" onClick={openAdd} data-testid="button-add-payroll">
            <Plus className="w-4 h-4 mr-1" /> Add Employee
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No payroll records for {monthLabel}. Click "Add Employee" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {items.map((item: any) => (
                      <TableRow key={item.PayrollID} data-testid={`row-payroll-${item.PayrollID}`}>
                        <TableCell className="font-medium">{item.FullName}</TableCell>
                        <TableCell>{item.Bank}</TableCell>
                        <TableCell>{item.Position}</TableCell>
                        <TableCell className="font-mono text-sm">{item.AccountNumber}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.Status === "Permanent"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {item.Status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R {parseFloat(item.Salary).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)} data-testid={`button-edit-${item.PayrollID}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.PayrollID)} data-testid={`button-delete-${item.PayrollID}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/40">
                      <TableCell colSpan={5} className="text-right text-sm">Total Payroll</TableCell>
                      <TableCell className="text-right">
                        R {totalSalary.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Payroll Record" : "Add Employee to Payroll"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="FullName">Full Name</Label>
              <Input id="FullName" placeholder="e.g. D MALINDA" value={form.FullName} onChange={e => setForm(f => ({ ...f, FullName: e.target.value }))} data-testid="input-fullname" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="Bank">Bank</Label>
              <Select value={form.Bank} onValueChange={v => setForm(f => ({ ...f, Bank: v }))}>
                <SelectTrigger data-testid="select-bank"><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>
                  {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="Position">Position</Label>
              <Input id="Position" placeholder="e.g. OPERATIONS MANAGER" value={form.Position} onChange={e => setForm(f => ({ ...f, Position: e.target.value }))} data-testid="input-position" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="AccountNumber">Account Number</Label>
              <Input id="AccountNumber" placeholder="e.g. 1768238985" value={form.AccountNumber} onChange={e => setForm(f => ({ ...f, AccountNumber: e.target.value }))} data-testid="input-account" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="Status">Status</Label>
              <Select value={form.Status} onValueChange={v => setForm(f => ({ ...f, Status: v }))}>
                <SelectTrigger data-testid="select-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="Salary">Salary (R)</Label>
              <Input id="Salary" type="number" placeholder="e.g. 7500" value={form.Salary} onChange={e => setForm(f => ({ ...f, Salary: e.target.value }))} data-testid="input-salary" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-payroll">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editItem ? "Save Changes" : "Add to Payroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Record</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this employee from the {monthLabel} payroll. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayrollReport;
