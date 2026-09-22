import { useState, useEffect } from "react";
import { usersService } from "@/services/users.service";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { StaffTable, StaffFormModal } from "./Users/index";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersService.getUsers();
      const list = (res.data ?? []) as any[];
      setUsers(
        list.map((u) => ({
          ...u,
          id: Number(u.id ?? u.Id ?? u.userId ?? 0),
          fullName: u.fullName ?? u.FullName ?? "",
          email: u.email ?? u.Email ?? "",
          role: u.role ?? u.Role ?? "Cashier",
          isActive: u.isActive ?? u.IsActive ?? true,
          employeeId: u.employeeId ?? u.EmployeeId,
          phoneNumber: u.phoneNumber ?? u.PhoneNumber,
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this staff member?"))
      return;

    try {
      await usersService.deactivateUser(id);
      toast.success("Staff member has been deactivated.");
      fetchUsers();
    } catch {
      toast.error("Failed to deactivate staff member.");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Staff Management"
        description="Create and manage staff accounts, roles, and passwords."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add New Staff
          </Button>
        }
      />

      <StaffTable
        users={users}
        loading={loading}
        onEdit={openEdit}
        onDeactivate={handleDeactivate}
      />

      <StaffFormModal
        open={showModal}
        user={editingUser}
        onClose={closeModal}
        onSaved={fetchUsers}
      />
    </div>
  );
}