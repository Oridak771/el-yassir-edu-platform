'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table'; // Uncommented
import { Input } from '@/components/ui/input'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Badge } from '@/components/ui/badge'; // For counts

type ClassDetail = {
  id: string;
  name: string;
  grade_level: string;
  academic_year: string;
  room_number?: string | null;
  schedule?: any; // JSONB, keep as any for form editing simplicity
  created_at: string;
  // Counts for display
  teacher_count?: number;
  student_count?: number;
};

// Type for form data
type ClassFormData = {
    name: string;
    grade_level: string;
    academic_year: string;
    room_number: string;
    schedule: string; // Store as JSON string for Textarea
};

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDetail | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({ name: '', grade_level: '', academic_year: '', room_number: '', schedule: '{}' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    // Fetch classes
    const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('name');

    if (classesError) {
        console.error('Error fetching classes:', classesError);
        setClasses([]);
        setLoading(false);
        return;
    }

    if (classesData) {
        // For each class, fetch teacher and student counts
        const enrichedClasses = await Promise.all(
            classesData.map(async (cls) => {
                const { count: teacherCount, error: teacherError } = await supabase
                    .from('teacher_assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', cls.id);

                const { count: studentCount, error: studentError } = await supabase
                    .from('class_enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', cls.id);
                
                if (teacherError) console.error(`Error fetching teacher count for class ${cls.id}:`, teacherError);
                if (studentError) console.error(`Error fetching student count for class ${cls.id}:`, studentError);

                return {
                    ...cls,
                    teacher_count: teacherCount ?? 0,
                    student_count: studentCount ?? 0,
                };
            })
        );
        setClasses(enrichedClasses);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const resetForm = () => {
      setEditingClass(null);
      setFormData({ name: '', grade_level: '', academic_year: '', room_number: '', schedule: '{}' });
      setShowClassDialog(false);
      setIsSubmitting(false);
  };

  const handleEditClick = (cls: ClassDetail) => {
    setEditingClass(cls);
    setFormData({
        name: cls.name,
        grade_level: cls.grade_level,
        academic_year: cls.academic_year,
        room_number: cls.room_number || '',
        schedule: cls.schedule ? JSON.stringify(cls.schedule, null, 2) : '{}',
    });
    setShowClassDialog(true);
  };

  const handleFormChange = (field: keyof ClassFormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClass = async () => {
    if (!formData.name || !formData.grade_level || !formData.academic_year) {
        alert("Class Name, Grade Level, and Academic Year are required.");
        return;
    }
    let scheduleJson;
    try {
        scheduleJson = JSON.parse(formData.schedule);
    } catch (e) {
        alert("Schedule is not valid JSON. Please provide a valid JSON object or '{}' for an empty schedule.");
        return;
    }

    setIsSubmitting(true);
    const classDataToSave = {
        name: formData.name,
        grade_level: formData.grade_level,
        academic_year: formData.academic_year,
        room_number: formData.room_number || null,
        schedule: scheduleJson,
    };

    let error;
    if (editingClass) {
        // Update existing class
        const { error: updateError } = await supabase
            .from('classes')
            .update(classDataToSave)
            .eq('id', editingClass.id);
        error = updateError;
    } else {
        // Create new class
        const { error: insertError } = await supabase
            .from('classes')
            .insert(classDataToSave);
        error = insertError;
    }

    if (error) {
        console.error('Error saving class:', error);
        alert(`Error saving class: ${error.message}`);
    } else {
        alert(`Class ${editingClass ? 'updated' : 'created'} successfully!`);
        resetForm();
        fetchClasses(); // Refresh list
    }
    setIsSubmitting(false);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
      if (!window.confirm(`Are you sure you want to delete class "${className}"? This will also delete related assignments and enrollments due to CASCADE settings.`)) {
          return;
      }
      setIsSubmitting(true); // Use isSubmitting to disable buttons during delete
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) {
          console.error("Error deleting class:", error);
          alert(`Error deleting class: ${error.message}`);
      } else {
          alert(`Class "${className}" deleted successfully.`);
          fetchClasses();
      }
      setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Class Management</h1>

        <Dialog open={showClassDialog} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowClassDialog(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingClass(null); setFormData({ name: '', grade_level: '', academic_year: '', room_number: '', schedule: '{}' }); setShowClassDialog(true);}}>Add New Class</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cName" className="text-right">Name *</Label>
                <Input id="cName" value={formData.name} onChange={e => handleFormChange('name', e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cGrade" className="text-right">Grade Level *</Label>
                <Input id="cGrade" value={formData.grade_level} onChange={e => handleFormChange('grade_level', e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cYear" className="text-right">Academic Year *</Label>
                <Input id="cYear" value={formData.academic_year} onChange={e => handleFormChange('academic_year', e.target.value)} className="col-span-3" required placeholder="e.g., 2024-2025" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cRoom" className="text-right">Room Number</Label>
                <Input id="cRoom" value={formData.room_number} onChange={e => handleFormChange('room_number', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cSchedule" className="text-right">Schedule (JSON)</Label>
                <Textarea id="cSchedule" rows={5} value={formData.schedule} onChange={e => handleFormChange('schedule', e.target.value)} className="col-span-3" placeholder='e.g., {"Monday": [{"subject": "Math", "time": "09:00-10:00", "teacher_id": "uuid"}]}' />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSaveClass} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingClass ? 'Save Changes' : 'Create Class')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          {/* Add Filters/Search here */}
        </CardHeader>
        <CardContent>
          {loading && <p>Loading classes...</p>}
          {!loading && classes.length === 0 && <p>No classes found. Add a new class to get started.</p>}
          {!loading && classes.length > 0 && (
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Grade</TableHeaderCell>
                        <TableHeaderCell>Academic Year</TableHeaderCell>
                        <TableHeaderCell>Room</TableHeaderCell>
                        <TableHeaderCell>Teachers</TableHeaderCell>
                        <TableHeaderCell>Students</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {classes.map(cls => (
                        <TableRow key={cls.id}>
                            <TableCell>{cls.name}</TableCell>
                            <TableCell>{cls.grade_level}</TableCell>
                            <TableCell>{cls.academic_year}</TableCell>
                            <TableCell>{cls.room_number || 'N/A'}</TableCell>
                            <TableCell><Badge variant="outline">{cls.teacher_count}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{cls.student_count}</Badge></TableCell>
                            <TableCell className="space-x-2 rtl:space-x-reverse">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(cls)}>Edit</Button>
                                <Button variant="outline" size="sm" onClick={() => alert(`Manage teachers for ${cls.name}`)}>Teachers</Button>
                                <Button variant="outline" size="sm" onClick={() => alert(`Manage students for ${cls.name}`)}>Students</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id, cls.name)} disabled={isSubmitting}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}