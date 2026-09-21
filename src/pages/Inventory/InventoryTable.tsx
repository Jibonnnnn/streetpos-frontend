import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgePill } from "@/components/common/BadgePill";
import { Pagination } from "@/components/common/Pagination";
import { Package, RefreshCw, Trash2 } from "lucide-react";
import type { InventoryItemResponse } from "@/types";

type InventoryTableProps = {
  items: InventoryItemResponse[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAdjust: (item: InventoryItemResponse) => void;
  onDelete: (item: InventoryItemResponse) => void;
  getItemValue: (item: InventoryItemResponse) => number;
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
};

export function InventoryTable({
  items,
  loading,
  search,
  onSearchChange,
  onRefresh,
  onAdjust,
  onDelete,
  getItemValue,
  page,
  totalPages,
  total,
  from,
  to,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: InventoryTableProps) {
  return (
    <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-950/50">
      <CardContent className="p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Stock List
            </h2>
            <p className="text-sm text-muted-foreground">
              Unit cost and stock value per item.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search name or unit…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-xs rounded-2xl"
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Package className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No inventory items yet. Add your first item.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Item</th>
                    <th className="pb-3 pr-4 font-medium">Stock</th>
                    <th className="pb-3 pr-4 font-medium">Unit Cost</th>
                    <th className="pb-3 pr-4 font-medium">Value</th>
                    <th className="pb-3 pr-4 font-medium">Reorder</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-3.5 pr-4">
                        <p className="font-medium">{item.name}</p>
                        {item.description ? (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums">
                        ₱
                        {(item.unitCost ?? 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 pr-4 tabular-nums font-medium">
                        ₱
                        {getItemValue(item).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        ≤ {item.reorderPoint} {item.unit}
                      </td>
                      <td className="py-3.5 pr-4">
                        <BadgePill
                          tone={item.isLowStock ? "warning" : "success"}
                        >
                          {item.isLowStock ? "Low" : "OK"}
                        </BadgePill>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => onAdjust(item)}
                          >
                            Adjust
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              from={from}
              to={to}
              onPageChange={onPageChange}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}