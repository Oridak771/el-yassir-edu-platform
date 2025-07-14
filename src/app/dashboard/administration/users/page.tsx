'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import usersData from '@/data/users.json';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'parent' | 'professor' | 'orientation';
  created_at: string;
};

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>(usersData);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'parent' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ email: '', full_name: '', role: 'parent' });
    setEditingUser(null);
    setShowUserDialog(false);
  };

  const handleCreateUser = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setUsers(prev => [
        ...prev,
        {
          id: (prev.length + 1).toString(),
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role as UserProfile['role'],
          created_at: new Date().toISOString(),
        },
      ]);
      resetForm();
      setIsSubmitting(false);
    }, 500);
  };

  const handleEditUserClick = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setShowUserDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowUserDialog(true)}>Add User</Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Full Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Created At</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell><Badge>{user.role}</Badge></TableCell>
                <TableCell>{user.created_at}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => handleEditUserClick(user)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (editingUser) {
                  setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
                  resetForm();
                } else {
                  handleCreateUser();
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={val => setFormData(f => ({ ...f, role: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="orientation">Orientation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>{editingUser ? 'Save' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}