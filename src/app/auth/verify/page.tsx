'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>Check your inbox to verify your email address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            We&apos;ve sent you a verification email. Please check your inbox and click the verification link to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/auth/login">
          <Button variant="outline">Return to Login</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
