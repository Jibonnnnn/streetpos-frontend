import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { DataTable } from "@/components/common/DataTable";
import { Edit, Trash2 } from "lucide-react";
import type { User } from "@/types";

type StaffTableProps = {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDeactivate: (id: number) => void;
};

export function StaffTable({
  users,
  loading,
  onEdit,
  onDeactivate,
}: StaffTableProps) {
  const columns = [
    {
      key: "fullName",
      accessor: "fullName" as keyof User,
      header: "Name",
      render: (u: User) => (
        <div>
          <p className="font-medium">{u.fullName}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      accessor: "role" as keyof User,
      header: "Role",
      render: (u: User) => (
        <BadgePill
          tone={
            u.role === "Admin"
              ? "danger"
              : u.role === "Manager"
                ? "info"
                : "success"
          }
        >
          {u.role}
        </BadgePill>
      ),
    },
    {
      key: "employeeId",
      accessor: "employeeId" as keyof User,
      header: "Employee ID",
      render: (u: User) => (
        <span className="text-sm text-muted-foreground">
          {u.employeeId || "—"}
        </span>
      ),
    },
    {
      key: "status",
      accessor: "isActive" as keyof User,
      header: "Status",
      render: (u: User) =>
        u.isActive ? (
          <BadgePill tone="success">Active</BadgePill>
        ) : (
          <BadgePill tone="neutral">Inactive</BadgePill>
        ),
    },
    {
      key: "actions",
      accessor: "id" as keyof User,
      header: "",
      render: (user: User) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
            <Edit className="h-4 w-4" />
          </Button>
          {user.isActive && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500"
              onClick={() => onDeactivate(user.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage="No staff accounts found."
    />
  );
}