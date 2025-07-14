'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import PDFGenerator from '@/components/PDFGenerator';
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';

const decisionsData = [
	{ id: '1', student: 'Jane Doe', decision: 'Promoted', date: '2025-06-10' },
	{ id: '2', student: 'Bob Smith', decision: 'Retained', date: '2025-06-11' },
];

export default function OrientationDecisionsPage() {
	const [decisions] = useState(decisionsData);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Decisions</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHead>
						<TableRow>
							<TableHeaderCell>Student</TableHeaderCell>
							<TableHeaderCell>Decision</TableHeaderCell>
							<TableHeaderCell>Date</TableHeaderCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{decisions.map(d => (
							<TableRow key={d.id}>
								<TableCell>{d.student}</TableCell>
								<TableCell>{d.decision}</TableCell>
								<TableCell>{d.date}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<PDFGenerator
					title="Decisions Report"
					filename="decisions_report.pdf"
					fields={[
						{ name: 'Student', value: '', x: 50, y: 700 },
						{ name: 'Decision', value: '', x: 200, y: 700 },
						{ name: 'Date', value: '', x: 350, y: 700 },
					]}
				/>
			</CardContent>
		</Card>
	);
}