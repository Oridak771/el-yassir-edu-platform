import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const paymentsData = [
  { id: '1', date: '2025-06-01', amount: 500, status: 'Paid' },
  { id: '2', date: '2025-07-01', amount: 500, status: 'Pending' },
];

export default function ParentPaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {paymentsData.map(payment => (
            <li key={payment.id} className="flex justify-between items-center py-2 border-b">
              <span>{payment.date}</span>
              <span>${payment.amount}</span>
              <Badge>{payment.status}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}