'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!role) {
        setError('Please select a role.');
        setLoading(false);
        return;
    }

    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Note: Supabase Auth `signUp` options.data doesn't directly populate profile tables.
        // We need a separate insert or trigger.
        // We'll handle profile creation after successful sign-up.
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If sign up is successful, insert the user profile into the public 'users' table
    if (authData.user) {
       const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Link to the auth.users table
          email: email, // Use the email provided
          full_name: fullName,
          role: role as any, // Cast role string to the enum type
        });

        if (profileError) {
            // Important: Handle potential failure to insert profile.
            // You might want to inform the user or try to delete the auth user
            // if the profile creation is critical.
            console.error('Profile insertion error:', profileError);
            setError(`Account created, but profile setup failed: ${profileError.message}. Please contact support.`);
        } else {
            setSuccessMessage('Registration successful! Please check your email to verify your account.');
            // Clear form or redirect after a delay
            setEmail('');
            setPassword('');
            setFullName('');
            setRole('');
            // Optionally redirect after a few seconds
            // setTimeout(() => router.push('/auth/login'), 3000);
        }
    } else {
        // This case might indicate an issue with the sign-up process itself
        setError('Registration failed. Could not retrieve user data after sign up.');
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              minLength={6} // Enforce minimum password length
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={setRole} value={role} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                {/* Add other roles if needed, consider admin/orientation registration flow */}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
