'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Added for notes
import { Badge } from '@/components/ui/badge';

type UserProfile = {
    id: string;
    email: string;
    full_name: string;
    role: string;
    metadata?: {
        children_ids?: string[];
    };
};

type LinkedChildInfo = {
    id: string;
    full_name: string;
};

type ChildLinkRequest = {
    id: string;
    child_email: string;
    child_full_name?: string | null;
    request_notes?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    review_comments?: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChildInfo[]>([]);
  const [linkRequests, setLinkRequests] = useState<ChildLinkRequest[]>([]);

  // Form states for profile update
  const [fullName, setFullName] = useState('');
  // Form states for password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  // Form states for child link request
  const [newLinkChildEmail, setNewLinkChildEmail] = useState('');
  const [newLinkChildName, setNewLinkChildName] = useState('');
  const [newLinkNotes, setNewLinkNotes] = useState('');


  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingLinkRequest, setIsSubmittingLinkRequest] = useState(false);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setAuthUser({
      id: '1',
      email: 'user@example.com',
      full_name: 'John Doe',
      role: 'parent',
      metadata: {
        children_ids: ['2', '3']
      }
    });
    setUserProfile({
      id: '1',
      email: 'user@example.com',
      full_name: 'John Doe',
      role: 'parent',
      metadata: {
        children_ids: ['2', '3']
      }
    });
    setFullName('John Doe');
    setLinkedChildren([
      { id: '2', full_name: 'Jane Doe' },
      { id: '3', full_name: 'Bob Smith' }
    ]);
    setLinkRequests([
      { id: '1', child_email: 'jane@example.com', child_full_name: 'Jane Doe', status: 'pending', requested_at: '2024-04-01T10:00:00' },
      { id: '2', child_email: 'bob@example.com', child_full_name: 'Bob Smith', status: 'approved', requested_at: '2024-04-02T11:00:00' }
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !userProfile) return;
    if (!fullName.trim()) {
        setMessage({ type: 'error', text: 'Full name cannot be empty.' });
        return;
    }
    setIsSubmittingName(true);
    setMessage(null);

    setTimeout(() => {
      setUserProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      setMessage({ type: 'success', text: 'Full name updated successfully!' });
      setIsSubmittingName(false);
    }, 1000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
        setMessage({ type: 'error', text: 'Please enter and confirm your new password.' });
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
    }
    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
        return;
    }

    setIsSubmittingPassword(true);
    setMessage(null);

    setTimeout(() => {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword('');
      setConfirmNewPassword('');
      setIsSubmittingPassword(false);
    }, 1000);
  };

  const handleRequestChildLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    if (!newLinkChildEmail.trim()) {
        setMessage({ type: 'error', text: "Child's email is required." });
        return;
    }
    setIsSubmittingLinkRequest(true);
    setMessage(null);

    setTimeout(() => {
      setMessage({ type: 'success', text: 'Child link request submitted successfully. Awaiting admin approval.' });
      setNewLinkChildEmail('');
      setNewLinkChildName('');
      setNewLinkNotes('');
      setLinkRequests(prev => [...prev, {
        id: '3',
        child_email: newLinkChildEmail,
        child_full_name: newLinkChildName.trim() || null,
        request_notes: newLinkNotes.trim() || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        review_comments: null
      }]);
      setIsSubmittingLinkRequest(false);
    }, 1000);
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        default: return 'outline';
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading settings...</p></div>;
  }

  if (!authUser || !userProfile) {
    return <div className="flex justify-center items-center h-full"><p>Could not load user data. Please try logging in again.</p></div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      {message && (
        <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>View and update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={authUser.email} disabled />
              <p className="text-xs text-gray-500">Email address cannot be changed here.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={userProfile.role} disabled className="capitalize" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmittingName || fullName === userProfile.full_name}>
              {isSubmittingName ? 'Saving...' : 'Update Full Name'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Parent-specific settings */}
      {userProfile.role === 'parent' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Linked Children</CardTitle>
              <CardDescription>View children linked to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              {linkedChildren.length > 0 ? (
                <ul className="space-y-2">
                  {linkedChildren.map(child => (
                    <li key={child.id} className="text-sm p-2 border rounded-md">{child.full_name} (ID: {child.id.substring(0,8)}...)</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No children currently linked to your account.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request to Link Child</CardTitle>
              <CardDescription>Submit a request to link a new child to your account. This requires admin approval.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestChildLink} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="linkChildEmail">Child's Email Address *</Label>
                  <Input id="linkChildEmail" type="email" value={newLinkChildEmail} onChange={e => setNewLinkChildEmail(e.target.value)} required placeholder="child@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linkChildName">Child's Full Name (Optional)</Label>
                  <Input id="linkChildName" type="text" value={newLinkChildName} onChange={e => setNewLinkChildName(e.target.value)} placeholder="John Doe Jr." />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linkNotes">Notes (Optional)</Label>
                  <Textarea id="linkNotes" value={newLinkNotes} onChange={e => setNewLinkNotes(e.target.value)} placeholder="Any additional information for the admin..." />
                </div>
                <Button type="submit" disabled={isSubmittingLinkRequest}>
                  {isSubmittingLinkRequest ? 'Submitting Request...' : 'Submit Link Request'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>My Child Link Requests</CardTitle>
            </CardHeader>
            <CardContent>
                {linkRequests.length === 0 ? (
                    <p className="text-sm text-gray-500">You have no pending or past child link requests.</p>
                ) : (
                    <ul className="space-y-3">
                        {linkRequests.map(req => (
                            <li key={req.id} className="p-3 border rounded-md">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">Child Email: {req.child_email}</p>
                                        {req.child_full_name && <p className="text-sm">Child Name: {req.child_full_name}</p>}
                                        <p className="text-xs text-gray-500">Requested: {new Date(req.requested_at).toLocaleDateString('en-GB')}</p>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(req.status)} className="capitalize">{req.status}</Badge>
                                </div>
                                {req.request_notes && <p className="text-sm mt-1 pt-1 border-t">Notes: {req.request_notes}</p>}
                                {req.review_comments && <p className="text-sm mt-1 pt-1 border-t text-blue-600">Admin Comments: {req.review_comments}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}