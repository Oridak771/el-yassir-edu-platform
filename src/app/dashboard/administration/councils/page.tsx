'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const councilsData = [
	{ id: '1', name: 'Disciplinary Council', date: '2025-06-18', status: 'Scheduled' },
	{ id: '2', name: 'Orientation Council', date: '2025-06-20', status: 'Completed' },
];

export default function AdministrationCouncilsPage() {
	const [councils] = useState(councilsData);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Councils</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{councils.map(c => (
						<li key={c.id}>
							<strong>{c.name}</strong> - {c.date} ({c.status})
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}