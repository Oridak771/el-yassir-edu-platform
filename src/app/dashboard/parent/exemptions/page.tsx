'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const exemptionsData = [
	{ id: '1', reason: 'Medical', status: 'Pending' },
	{ id: '2', reason: 'Family Emergency', status: 'Approved' },
];

export default function ParentExemptionsPage() {
	const [exemptions] = useState(exemptionsData);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Exemption Requests</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{exemptions.map((ex) => (
						<li key={ex.id} className="mb-2">
							<strong>{ex.reason}</strong>{' '}
							<span className="ml-2">[{ex.status}]</span>
						</li>
					))}
				</ul>
				<FileUploader />
			</CardContent>
		</Card>
	);
}