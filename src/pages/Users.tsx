import { useState, useEffect } from 'react';
import { usersService } from '@/services/users.service';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/layout';
import { ModalShell } from '@/components/dialogs/ModalShell';
import { BadgePill } from '@/components/common/BadgePill';
import { FormField } from '@/components/forms/form-field';
import { FormSection } from '@/components/forms/form-section';
import { CheckCircle2 } from 'lucide-react';

type StaffRole = 'Admin' | 'Manager' | 'Cashier';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Cashier' as StaffRole,
    password: '',
  });

  const roleOptions: StaffRole[] = ['Cashier', 'Manager', 'Admin'];

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersService.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === 'fullName') {
      newErrors.fullName = value.trim() ? '' : 'Full name is required';
    }

    if (field === 'email') {
      if (!value.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(value)) newErrors.email = 'Please enter a valid email';
      else newErrors.email = '';
    }

    if (field === 'password' && !editingUser) {
      if (!value) newErrors.password = 'Password is required';
      else if (value.length < 8) newErrors.password = 'Password must be at least 8 characters';
      else if (!/[a-z]/.test(value)) newErrors.password = 'Password must contain at least one lowercase letter';
      else newErrors.password = '';
    }

    setErrors(newErrors);
  };

  const openModal = (user?: User) => {
    setErrors({ fullName: '', email: '', password: '' });
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        role: user.role,
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'Cashier',
        password: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) return;
    if (!editingUser && (!formData.password || formData.password.length < 8)) return;

    try {
      if (!editingUser) {
        await usersService.createUser({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || null,
          password: formData.password,
          role: formData.role
        });
        toast.success('New staff account created successfully!');
      } else {
        await usersService.updateUser(editingUser.id, {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber || null,
          role: formData.role,
          isActive: true
        });
        toast.success('Staff information updated successfully!');
      }

      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save staff.";
      toast.error(msg);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      await usersService.deactivateUser(id);
      toast.success('Staff member has been deactivated.');
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to deactivate staff member.');
    }
  };

  const columns = [
    { header: "Employee ID", accessor: (u: User) => u.employeeId || '-' },
    { header: "Full Name", accessor: "fullName" as const },
    { header: "Email", accessor: "email" as const },
    { 
      header: "Role", 
      accessor: (u: User) => (
        <BadgePill tone={u.role === 'Admin' ? 'danger' : u.role === 'Manager' ? 'info' : 'success'}>
          {u.role}
        </BadgePill>
      )
    },
    { 
      header: "Status", 
      accessor: (u: User) => (
        <BadgePill tone={u.isActive ? 'success' : 'danger'}>
          {u.isActive ? 'Active' : 'Inactive'}
        </BadgePill>
      )
    },
  ];

  const actions = (user: User) => (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={() => openModal(user)}>
        <Edit className="w-4 h-4" />
      </Button>
      {user.isActive && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:bg-red-50"
          onClick={() => handleDeactivate(user.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader 
        title="Staff Management" 
        actions={
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add New Staff
          </Button>
        }
      />

      <DataTable 
        data={users}
        columns={columns}
        loading={loading}
        actions={actions}
        emptyMessage="No staff accounts found."
      />

      <ModalShell
        open={showModal}
        title={editingUser ? 'Edit Staff Member' : 'Add New Staff'}
        description="Create or update staff access and profile details."
        onClose={() => setShowModal(false)}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection
            title="Profile details"
            description="This information appears in staff lists and account summaries."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full name" description="Shown throughout the admin workspace." error={errors.fullName || undefined}>
                <Input
                  placeholder="Maria Santos"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    validateField('fullName', e.target.value);
                  }}
                  className={errors.fullName ? "border-red-500" : ""}
                  required
                />
              </FormField>

              <FormField label="Email address" description="Used for login and notifications." error={errors.email || undefined}>
                <Input
                  type="email"
                  placeholder="staff@streetpos.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateField('email', e.target.value);
                  }}
                  className={errors.email ? "border-red-500" : ""}
                  required
                  disabled={!!editingUser}
                />
              </FormField>
            </div>

            <FormField label="Phone number" description="Optional contact number for shift coordination.">
              <Input
                placeholder="0917 123 4567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </FormField>
          </FormSection>

          <FormSection
            title="Access level"
            description="Choose the role that matches the employee's responsibilities."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`rounded-3xl border p-4 text-left transition-all ${
                    formData.role === role
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 bg-background hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{role}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {role === 'Admin' ? 'Full system access' : role === 'Manager' ? 'Operations and inventory' : 'POS-only access'}
                      </p>
                    </div>
                    {formData.role === role ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                  </div>
                </button>
              ))}
            </div>
          </FormSection>

          {!editingUser && (
            <FormSection
              title="Security"
              description="Create the initial password for the new staff account."
            >
              <FormField label="Password" description="Minimum 8 characters and one lowercase letter." error={errors.password || undefined}>
                <Input
                  type="password"
                  placeholder="Enter a secure password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    validateField('password', e.target.value);
                  }}
                  className={errors.password ? "border-red-500" : ""}
                  required
                />
              </FormField>
            </FormSection>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              {editingUser ? 'Update staff' : 'Create staff'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}