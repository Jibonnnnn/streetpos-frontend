import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Cashier' as 'Admin' | 'Manager' | 'Cashier',
    password: '',
  });

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
      const res = await api.get('/users');
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
        await api.post('/users', {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || null,
          password: formData.password,
          role: formData.role
        });
        toast.success('New staff account created successfully!');
      } else {
        await api.put(`/users/${editingUser.id}`, {
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
      const msg = err.response?.data?.message || 
                  err.response?.data?.error || 
                  "Failed to save staff. Please check your input.";
      toast.error(msg);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      await api.put(`/users/${id}/deactivate`);
      toast.success('Staff member has been deactivated.');
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to deactivate staff member.');
    }
  };

  if (loading) return <div className="p-8">Loading staff...</div>;

  return (
    <div className="p-8 relative">
      <Toaster position="top-center" richColors closeButton />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Staff Management</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Add New Staff
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50 dark:bg-zinc-800">
              <th className="text-left p-4">Employee ID</th>
              <th className="text-left p-4">Full Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <td className="p-4 font-mono font-medium">{user.employeeId || '-'}</td>
                <td className="p-4 font-medium">{user.fullName}</td>
                <td className="p-4 text-zinc-600">{user.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right flex gap-2 justify-end">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">
                {editingUser ? 'Edit Staff Member' : 'Add New Staff'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      validateField('fullName', e.target.value);
                    }}
                    className={errors.fullName ? "border-red-500" : ""}
                    required
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      validateField('email', e.target.value);
                    }}
                    className={errors.email ? "border-red-500" : ""}
                    required
                    disabled={!!editingUser}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <Input
                  placeholder="Phone Number (optional)"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    className="w-full p-3 rounded-2xl border border-input bg-background"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {!editingUser && (
                  <div>
                    <Input
                      type="password"
                      placeholder="Password (min 8 chars, 1 lowercase)"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        validateField('password', e.target.value);
                      }}
                      className={errors.password ? "border-red-500" : ""}
                      required
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingUser ? 'Update Staff' : 'Create Staff'}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}