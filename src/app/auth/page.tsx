import React from 'react';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow p-8 space-y-6">
      <h2 className="text-2xl font-bold text-center">Welcome to El Yassir EDU</h2>
      <div className="flex flex-col space-y-4">
        <Link href="/auth/login">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded">
            Login
          </button>
        </Link>
        <Link href="/auth/register">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded">
            Register
          </button>
        </Link>
      </div>
    </div>
  );
}
