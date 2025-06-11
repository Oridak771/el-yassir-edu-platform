'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Uncommented
import { Input } from '@/components/ui/input'; // Uncommented
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Uncommented
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Badge } from '@/components/ui/badge'; // For role display

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'parent' | 'professor' | 'orientation';
  created_at: string;
  // Add metadata if needed later
};

// Type for form state (editing or new)
type UserFormData = {
    email: string;
    full_name: string;
    role: 'admin' | 'parent' | 'professor' | 'orientation';
    password?: string; // Only for new user
};

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null); // User being edited
  const [formData, setFormData] = useState<UserFormData>({ email: '', full_name: '', role: 'parent', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
    } else {
        setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
      setEditingUser(null);
      setFormData({ email: '', full_name: '', role: 'parent', password: '' });
      setShowUserDialog(false);
      setIsSubmitting(false);
  };

  const handleCreateUser = async () => {
    // IMPORTANT: Creating users requires Admin privileges and interacting with auth.users.
    // This typically needs to be done via an Edge Function calling supabase.auth.admin.createUser
    // or directly using the Admin SDK in a secure backend environment.
    // The client-side code here is just a placeholder for the UI flow.
    setIsSubmitting(true);
    alert(`Placeholder: Create user ${formData.email} with role ${formData.role}. Requires Admin SDK via Edge Function.`);
    // Example Edge Function call (pseudo-code):
    // const { data, error } = await supabase.functions.invoke('create-user', {
    //   body: { email: formData.email, password: formData.password, fullName: formData.full_name, role: formData.role },
    // });
    // if (error) { alert(`Error: ${error.message}`); } else { alert('User created!'); resetForm(); fetchUsers(); }
    setIsSubmitting(false);
    // For now, just close dialog
     resetForm();
  };

  const handleEditUserClick = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ // Pre-fill form data for editing
        email: user.email,
        full_name: user.full_name,
        role: user.role,
    });
    setShowUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);

    // Update public.users table (RLS allows admin)
    const { error: profileUpdateError } = await supabase
        .from('users')
        .update({
            full_name: formData.full_name,
            role: formData.role,
            // email cannot be updated here easily, requires auth update
        })
        .eq('id', editingUser.id);

    if (profileUpdateError) {
        console.error("Error updating user profile:", profileUpdateError);
        alert(`Error updating profile: ${profileUpdateError.message}`);
        setIsSubmitting(false);
        return;
    }

    // IMPORTANT: Updating email or role might require Admin SDK calls
    // to update auth.users as well, potentially via an Edge Function.
    // Example: supabase.auth.admin.updateUserById(...)

    alert(`User ${editingUser.full_name} updated successfully! (Role/Email changes might require Admin SDK)`);
    resetForm();
    fetchUsers(); // Refresh list
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
     // IMPORTANT: Deleting users requires Admin privileges and interacting with auth.users.
     // This MUST be done via an Edge Function or secure backend.
     if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action is irreversible.`)) {
         return;
     }
     alert(`Placeholder: Delete user ${userEmail} (ID: ${userId}). Requires Admin SDK via Edge Function.`);
     // Example Edge Function call (pseudo-code):
     // const { data, error } = await supabase.functions.invoke('delete-user', { body: { userId } });
     // if (error) { alert(`Error: ${error.message}`); } else { alert('User deleted!'); fetchUsers(); }
  };

  const handleFormChange = (field: keyof UserFormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>

        <Dialog open={showUserDialog} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowUserDialog(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUser(null); setFormData({ email: '', full_name: '', role: 'parent', password: '' }); setShowUserDialog(true);}}>Add New User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uFullName" className="text-right">Full Name *</Label>
                <Input id="uFullName" value={formData.full_name} onChange={e => handleFormChange('full_name', e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uEmail" className="text-right">Email *</Label>
                <Input id="uEmail" type="email" value={formData.email} onChange={e => handleFormChange('email', e.target.value)} className="col-span-3" required disabled={!!editingUser} />
              </div>
              {!editingUser && ( // Only show password field for new users
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="uPassword" className="text-right">Password *</Label>
                    <Input id="uPassword" type="password" value={formData.password} onChange={e => handleFormChange('password', e.target.value)} className="col-span-3" required minLength={6} />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uRole" className="text-right">Role *</Label>
                <Select value={formData.role} onValueChange={value => handleFormChange('role', value as UserFormData['role'])} required>
                  <SelectTrigger id="uRole" className="col-span-3"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="orientation">Orientation Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={editingUser ? handleUpdateUser : handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create User')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          {/* Add Search/Filter inputs here */}
        </CardHeader>
        <CardContent>
          {loading && <p>Loading users...</p>}
          {!loading && users.length === 0 && <p>No users found.</p>}
          {!loading && users.length > 0 && (
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Email</TableHeaderCell>
                        <TableHeaderCell>Role</TableHeaderCell>
                        <TableHeaderCell>Joined</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="space-x-2 rtl:space-x-reverse">
                                <Button variant="outline" size="sm" onClick={() => handleEditUserClick(user)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id, user.email)}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
           {/* Add Pagination controls here later */}
        </CardContent>
      </Card>

    </div>
  );
}