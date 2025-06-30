'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
// import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // Uncommented

// Type for user profile, assuming metadata structure
type UserProfileWithChildren = {
    id: string;
    full_name: string;
    metadata?: {
        children_ids?: string[];
    }
};

// Type for joined student data
type StudentInfoFromDB = {
    full_name: string;
};

// Type for fetched payment data
type PaymentQueryResult = {
  id: string;
  student_id: string;
  payment_type: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'; // Use enum type if defined in DB
  description?: string | null;
  payment_date?: string | null;
  academic_year: string;
  student: unknown; // Use unknown for joined data initially
};

type Payment = {
  id: string;
  child_id: string;
  child_name: string;
  payment_type: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string | null;
  payment_date?: string | null;
  academic_year: string;
};

export default function ParentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfileWithChildren | null>(null);
  const [childrenInfo, setChildrenInfo] = useState<Map<string, string>>(new Map()); // Map child ID to name


  const fetchPaymentData = useCallback(async (childrenIds: string[]) => {
    if (!childrenIds || childrenIds.length === 0) {
        setPayments([]);
        setLoading(false);
        return;
    }
    setLoading(true);

    // Fetch payments for linked children
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:student_id(full_name)
      `) // Assuming student_id in payments table links to users
      .in('student_id', childrenIds)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } else if (data) {
        // Format data with robust type checking for joined student field
        const formattedPayments = (data as PaymentQueryResult[]).map(p => {
            let studentName = 'Unknown Child';
            // Check if student data is a valid object
            if (p.student && typeof p.student === 'object' && !Array.isArray(p.student) && 'full_name' in p.student) {
                studentName = (p.student as StudentInfoFromDB).full_name || studentName;
            } else {
                // Fallback to map if join failed or was null
                studentName = childrenInfo.get(p.student_id) || studentName;
            }

            return {
                id: p.id,
                child_id: p.student_id,
                child_name: studentName,
                payment_type: p.payment_type,
                amount: p.amount,
                due_date: p.due_date,
                status: p.status,
                description: p.description,
                payment_date: p.payment_date,
                academic_year: p.academic_year,
            };
        });
      setPayments(formattedPayments);
    }
    setLoading(false);
  }, [childrenInfo]); // Depend on childrenInfo map

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
          setLoading(false);
          // Redirect?
          return;
      }

      const profile = await getUserProfile(session.user.id) as UserProfileWithChildren | null;
      setCurrentUser(profile);

      const childrenIds = profile?.metadata?.children_ids;
      if (profile && childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
          // Fetch children names first
          const { data: childrenData, error: childrenError } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', childrenIds);

          let childrenNameMap = new Map<string, string>();
          if (childrenError) {
              console.error("Error fetching children names:", childrenError);
          } else if (childrenData) {
              childrenNameMap = new Map(childrenData.map(c => [c.id, c.full_name]));
              setChildrenInfo(childrenNameMap); // Set state
          }
          // Now fetch payments, fetchPaymentData will use the map
          fetchPaymentData(childrenIds);
      } else {
          console.log("No children found for parent or profile missing.");
          setPayments([]);
          setLoading(false);
      }
    };
    init();
  }, [fetchPaymentData]); // fetchPaymentData has childrenInfo in its deps now


  // Adjusted to return variants compatible with Badge component
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (status) {
        case 'paid': return 'default'; // Use default (often green background or primary color)
        case 'pending': return 'secondary'; // Use secondary (often gray)
        case 'overdue': return 'destructive'; // Use destructive (red)
        case 'cancelled': return 'outline'; // Use outline (gray border)
        default: return 'outline'; // Default fallback
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Enrollment Payments & Deadlines</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Past Due Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading payment information...</p>}
          {!loading && payments.length === 0 && <p>No payment information available for your child(ren).</p>}
          {!loading && payments.length > 0 && (
            <ul className="mt-4 space-y-3">
              {payments.map(payment => (
                <li key={payment.id} className="p-3 border rounded-md">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <strong>{payment.payment_type}</strong> for {payment.child_name} ({payment.academic_year})
                      <p className="text-lg font-semibold">${payment.amount.toFixed(2)}</p>
                      <p className="text-sm">Due Date: {new Date(payment.due_date).toLocaleDateString()}</p>
                      {payment.status === 'paid' && payment.payment_date &&
                        <p className="text-xs text-green-700">Paid on: {new Date(payment.payment_date).toLocaleDateString()}</p>}
                      {payment.description && <p className="text-xs text-gray-500 mt-1">Description: {payment.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 mt-2 sm:mt-0">
                      <Badge variant={getStatusVariant(payment.status)} className="capitalize mb-2 block sm:inline-block sm:mb-0">
                        {payment.status}
                      </Badge>
                      {/* TODO: Add actual payment link/integration */}
                      {payment.status === 'pending' && <Button size="sm" className="mt-2 w-full sm:w-auto sm:mt-0 sm:ml-2">Pay Now</Button>}
                      {payment.status === 'overdue' && <Button size="sm" variant="destructive" className="mt-2 w-full sm:w-auto sm:mt-0 sm:ml-2">Pay Now</Button>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A log of all past payments will be shown here.</p>
          {/* TODO: Implement a filter or separate view for paid transactions */}
          {/* Example: Filter payments state: payments.filter(p => p.status === 'paid').map(...) */}
        </CardContent>
      </Card>
    </div>
  );
}