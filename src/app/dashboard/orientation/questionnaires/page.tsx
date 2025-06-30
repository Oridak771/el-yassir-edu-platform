'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import { Input } from '@/components/ui/input'; // Uncommented
import { Textarea } from '@/components/ui/textarea'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // Uncommented
import { Switch } from '@/components/ui/switch'; // For active toggle
import { Badge } from '@/components/ui/badge'; // For response count

type OrientationForm = {
  id: string;
  title: string;
  questions: any; // JSONB
  creator_id: string;
  active: boolean;
  created_at: string;
  response_count?: number; // Joined or calculated
};

// Type for form data
type FormDataType = {
    title: string;
    questionsJson: string; // Store questions as JSON string for Textarea
    active: boolean;
};

export default function OrientationQuestionnairesPage() {
  const [forms, setForms] = useState<OrientationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<OrientationForm | null>(null);
  const [formData, setFormData] = useState<FormDataType>({ title: '', questionsJson: '[]', active: true });
  const [currentUser, setCurrentUser] = useState<any>(null); // Store current user profile
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        // Handle not logged in
        return;
    }
    setCurrentUser(user); // Store auth user

    // Fetch orientation forms
    // For simplicity, an admin/orientation supervisor can see all forms.
    // If only creator can see, add .eq('creator_id', user.id)
    const { data: formsData, error: formsError } = await supabase
      .from('orientation_forms')
      .select('*, orientation_responses(count)') // Fetch response count
      .order('created_at', { ascending: false });

    if (formsError) {
      console.error('Error fetching forms:', formsError);
      setForms([]);
    } else if (formsData) {
      const formattedForms = formsData.map((f: any) => ({
        ...f,
        // Supabase returns count as an array with one object: [{ count: N }]
        response_count: f.orientation_responses && f.orientation_responses.length > 0 ? f.orientation_responses[0].count : 0,
      }));
      setForms(formattedForms);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);


  const resetForm = () => {
    setEditingForm(null);
    setFormData({ title: '', questionsJson: '[]', active: true });
    setShowFormDialog(false);
    setIsSubmitting(false);
  };

  const handleEditClick = (form: OrientationForm) => {
    setEditingForm(form);
    setFormData({
        title: form.title,
        questionsJson: JSON.stringify(form.questions, null, 2), // Pretty print JSON for editing
        active: form.active,
    });
    setShowFormDialog(true);
  };

  const handleSaveForm = async () => {
    if (!currentUser || !formData.title) {
        alert("Title is required.");
        return;
    }
    let questionsParsed;
    try {
      questionsParsed = JSON.parse(formData.questionsJson);
      if (!Array.isArray(questionsParsed)) throw new Error("Questions must be a JSON array.");
    } catch (e: any) {
      alert(`Invalid JSON format for questions: ${e.message}`);
      return;
    }

    setIsSubmitting(true);
    const dataToSave = {
        title: formData.title,
        questions: questionsParsed,
        active: formData.active,
        creator_id: editingForm ? editingForm.creator_id : currentUser.id, // Keep original creator or set new
    };

    let error;
    if (editingForm) {
      // Update
      const { error: updateError } = await supabase
        .from('orientation_forms')
        .update(dataToSave)
        .eq('id', editingForm.id);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('orientation_forms')
        .insert(dataToSave);
      error = insertError;
    }

    if (error) {
      console.error('Error saving form:', error);
      alert(`Error saving form: ${error.message}`);
    } else {
      alert(`Form ${editingForm ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchForms(); // Refresh list
    }
    setIsSubmitting(false);
  };

  const handleToggleActive = async (form: OrientationForm) => {
      setIsSubmitting(true); // Use general submitting state or a specific one
      const { error } = await supabase
        .from('orientation_forms')
        .update({ active: !form.active })
        .eq('id', form.id);

      if (error) {
          alert(`Error updating form status: ${error.message}`);
      } else {
          alert(`Form ${form.title} ${!form.active ? 'activated' : 'deactivated'}.`);
          fetchForms();
      }
      setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orientation Questionnaires</h1>
        <Dialog open={showFormDialog} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowFormDialog(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingForm(null); setFormData({ title: '', questionsJson: '[]', active: true }); setShowFormDialog(true);}}>Create New Questionnaire</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>{editingForm ? 'Edit Questionnaire' : 'Create New Questionnaire'}</DialogTitle></DialogHeader>
            <div className="py-4 space-y-3">
              <div>
                <Label htmlFor="formTitle">Title *</Label>
                <Input id="formTitle" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div>
                <Label htmlFor="formQuestions">Questions (JSON format) *</Label>
                <Textarea id="formQuestions" rows={10} value={formData.questionsJson} onChange={e => setFormData({...formData, questionsJson: e.target.value})} required placeholder='[{"type": "text", "label": "Your Name", "key": "name"}, {"type": "mcq", "label": "Choice?", "key": "choice", "options": ["A", "B"]}]' />
                <p className="text-xs text-gray-500 mt-1">Each question should be an object with at least "type", "label", and a unique "key".</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="formActive" checked={formData.active} onCheckedChange={(checked: boolean) => setFormData({...formData, active: checked})} />
                <Label htmlFor="formActive">Active (Accepting Responses)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSaveForm} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingForm ? 'Save Changes' : 'Create Form')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Questionnaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading questionnaires...</p>}
          {!loading && forms.length === 0 && <p>No questionnaires created yet.</p>}
          {!loading && forms.length > 0 && (
            <ul className="space-y-3">
              {forms.map(form => (
                <li key={form.id} className={`p-4 border rounded-md ${form.active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg">{form.title}</h3>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(form.created_at).toLocaleDateString()} | Status: <Badge variant={form.active ? 'default' : 'secondary'}>{form.active ? 'Active' : 'Inactive'}</Badge>
                      </p>
                      <p className="text-sm">Responses: <Badge variant="outline">{form.response_count || 0}</Badge></p>
                    </div>
                    <div className="flex-shrink-0 mt-2 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-2 rtl:space-x-reverse flex flex-col sm:flex-row items-stretch sm:items-center">
                      <Button variant="outline" size="sm" onClick={() => alert(`Viewing responses for ${form.title} (Not Implemented)`)}>View Responses</Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(form)}>Edit</Button>
                      <Button variant={form.active ? "destructive" : "default"} size="sm" onClick={() => handleToggleActive(form)} disabled={isSubmitting}>
                        {form.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}