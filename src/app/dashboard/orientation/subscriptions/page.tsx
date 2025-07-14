'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const subscriptionsData = [
  { id: '1', name: 'Newsletter', status: 'Active' },
  { id: '2', name: 'Event Updates', status: 'Inactive' },
];

export default function OrientationSubscriptionsPage() {
  const [subscriptions] = useState(subscriptionsData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {subscriptions.map(sub => (
            <li key={sub.id}>
              <strong>{sub.name}</strong> - {sub.status}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}