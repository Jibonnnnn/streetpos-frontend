import { useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout";
import { DataTable } from "@/components/common/DataTable";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    paymentMethod: "",
    cashierEmployeeId: ""
  });

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getSalesReport(filters);
      setReport(res.data);
      toast.success("Report generated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    if (!report) {
      toast.error("Generate report first");
      return;
    }
    setExporting(true);
    try {
      const res = await dashboardService.exportPdf(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sales-report-${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <PageHeader 
        title="Sales Reports" 
        description="Filter, view, and export sales data with CSRxxx support."
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <select value={filters.paymentMethod} onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})} className="w-full border rounded-2xl p-3">
                <option value="">All</option>
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Maya">Maya</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div>
              <Label>Cashier (CSRxxx)</Label>
              <Input placeholder="CSR001" value={filters.cashierEmployeeId} onChange={(e) => setFilters({...filters, cashierEmployeeId: e.target.value})} />
            </div>
            <Button onClick={generateReport} disabled={loading} className="mt-6">
              {loading ? "Generating..." : "Generate Full Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardContent className="p-6"><p className="text-3xl font-bold">₱{report.totalSales?.toFixed(2)}</p><p>Total Sales</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-3xl font-bold">{report.totalOrders}</p><p>Total Orders</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-3xl font-bold">₱{report.averageOrderValue?.toFixed(2)}</p><p>Avg Order</p></CardContent></Card>
          </div>

          <div className="flex gap-4">
            <Button onClick={exportPdf} disabled={exporting}>
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>

          <DataTable 
            data={report.dailySummaries || []} 
            columns={[
              { header: "Date", accessor: "date" as const },
              { header: "Sales", accessor: (item: any) => `₱${item.sales?.toFixed(2) || 0}` },
              { header: "Orders", accessor: "orders" as const },
            ]} 
          />
        </div>
      )}
    </div>
  );
}