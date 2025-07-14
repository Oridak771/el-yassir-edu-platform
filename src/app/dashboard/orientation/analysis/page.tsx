'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Chart from '@/components/Chart';

const classesData = [
  { id: '1', name: 'Class A', grade_level: 9 },
  { id: '2', name: 'Class B', grade_level: 10 },
];
const subjectsData = [
  { id: '1', name: 'Math' },
  { id: '2', name: 'Science' },
];
const gradesData = [
  { id: '1', student: 'Jane Doe', subject: 'Math', grade: 88 },
  { id: '2', student: 'Bob Smith', subject: 'Science', grade: 92 },
];

type AnalysisType = 'class_histogram' | 'module_average' | 'level_average';

type ChartDataItem = {
  name: string; // For xKey or nameKey
  value: number; // For dataKey
  // Add other potential fields if needed by different chart types
  [key: string]: any; // Allow other properties
};

export default function OrientationGradeAnalysisPage() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('class_histogram');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [availableClasses, setAvailableClasses] = useState<{id: string, name: string}[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);

  const [classes] = useState(classesData);
  const [subjects] = useState(subjectsData);
  const [grades] = useState(gradesData);

  // Fetch data for filters on initial load
  useEffect(() => {
    setLoadingFilters(false);
    setAvailableClasses(classesData);
    setAvailableLevels(classesData.map(c => c.grade_level.toString()));
    setAvailableModules(subjectsData.map(s => s.name));
  }, []);

  // Perform analysis when filters change
  const performAnalysis = useCallback(async () => {
    if (
        (analysisType === 'class_histogram' && !selectedClassId) ||
        (analysisType === 'module_average' && (!selectedModule || !selectedLevel)) || // Module average needs level context
        (analysisType === 'level_average' && !selectedLevel)
    ) {
      setChartData([]);
      return;
    }
    setLoading(true);
    let newChartData: ChartDataItem[] = [];

    try {
        if (analysisType === 'class_histogram' && selectedClassId) {
            const { data: grades, error } = await supabase
                .from('grades')
                .select('score, total_possible')
                .eq('class_id', selectedClassId);
            if (error) throw error;

            if (grades && grades.length > 0) {
                const distribution = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
                grades.forEach(g => {
                    const percentage = (g.score / (g.total_possible || 100)) * 100;
                    if (percentage <= 20) distribution['0-20%']++;
                    else if (percentage <= 40) distribution['21-40%']++;
                    else if (percentage <= 60) distribution['41-60%']++;
                    else if (percentage <= 80) distribution['61-80%']++;
                    else distribution['81-100%']++;
                });
                newChartData = Object.entries(distribution).map(([key, value]) => ({ name: key, value }));
            }
        } else if (analysisType === 'module_average' && selectedModule && selectedLevel) {
            // Fetch all grades for the selected level and module
            const { data: grades, error } = await supabase
                .from('grades')
                .select('score, total_possible, classes!inner(grade_level)')
                .eq('subject', selectedModule)
                .eq('classes.grade_level', selectedLevel);
            if (error) throw error;
            if (grades && grades.length > 0) {
                const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
                const totalPossible = grades.reduce((sum, g) => sum + (g.total_possible || 100), 0);
                const average = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
                newChartData = [{ name: selectedModule, value: parseFloat(average.toFixed(1)) }];
            }
        } else if (analysisType === 'level_average' && selectedLevel) {
             const { data: grades, error } = await supabase
                .from('grades')
                .select('score, total_possible, classes!inner(grade_level)')
                .eq('classes.grade_level', selectedLevel);
            if (error) throw error;
            if (grades && grades.length > 0) {
                const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
                const totalPossible = grades.reduce((sum, g) => sum + (g.total_possible || 100), 0);
                const average = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
                newChartData = [{ name: `Grade ${selectedLevel} Avg`, value: parseFloat(average.toFixed(1)) }];
            }
        }
    } catch (err) {
        console.error("Error performing analysis:", err);
    }

    setChartData(newChartData);
    setLoading(false);
  }, [analysisType, selectedClassId, selectedModule, selectedLevel]);

   useEffect(() => {
    performAnalysis();
  }, [performAnalysis]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Grade Analysis & Calculators</h1>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="analysisTypeSelect">Analysis Type</Label>
            <Select value={analysisType} onValueChange={(val) => setAnalysisType(val as AnalysisType)}>
              <SelectTrigger id="analysisTypeSelect"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="class_histogram">Class Histogram</SelectItem>
                <SelectItem value="module_average">Module Average (by Level)</SelectItem>
                <SelectItem value="level_average">Overall Level Average</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="levelSelect">Grade Level</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={loadingFilters || analysisType === 'class_histogram'}>
              <SelectTrigger id="levelSelect"><SelectValue placeholder="Select Level" /></SelectTrigger>
              <SelectContent>{availableLevels.map(l => <SelectItem key={l} value={l}>Grade {l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="classSelect">Class (for Histogram)</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={loadingFilters || analysisType !== 'class_histogram'}>
              <SelectTrigger id="classSelect"><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{availableClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="moduleSelect">Module/Subject (for Module Avg)</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule} disabled={loadingFilters || analysisType !== 'module_average'}>
              <SelectTrigger id="moduleSelect"><SelectValue placeholder="Select Module" /></SelectTrigger>
              <SelectContent>{availableModules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {analysisType === 'class_histogram' && selectedClassId ? `Histogram for ${availableClasses.find(c=>c.id === selectedClassId)?.name}` : 
             analysisType === 'module_average' && selectedModule && selectedLevel ? `Average for ${selectedModule} - Grade ${selectedLevel}` :
             analysisType === 'level_average' && selectedLevel ? `Overall Average for Grade ${selectedLevel}` :
             'Analysis Results'}
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {loading && <p>Loading analysis data...</p>}
          {!loading && chartData.length === 0 && <p>No data to display for the selected filters. Please select filters above.</p>}
          {!loading && chartData.length > 0 && (
            analysisType === 'class_histogram' ?
              <Chart type="bar" data={chartData} xKey="name" dataKey="value" title="" width="100%" /> :
            analysisType === 'module_average' || analysisType === 'level_average' ?
              // Display as text or simple bar for single value average
              <div className="text-2xl font-bold">{chartData[0].name}: {chartData[0].value}%</div> :
            <p>Select analysis type and filters to view data.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average/Percentage Calculators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Tools for calculating module- and level-based averages and percentages will be available here.</p>
          {/* TODO: Implement specific calculator UIs */}
        </CardContent>
      </Card>
    </div>
  );
}