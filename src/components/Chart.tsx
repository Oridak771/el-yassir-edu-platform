'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ChartProps = {
  title: string;
  type: 'bar' | 'pie' | 'line';
  data: any[];
  xKey?: string;
  yKey?: string;
  dataKey?: string;
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  height?: number;
  width?: number | string; // Allow both number and string for width
  stacked?: boolean;
};

export default function Chart({
  title,
  type,
  data,
  xKey,
  yKey,
  dataKey,
  nameKey = 'name',
  valueKey = 'value',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'],
  height = 300,
  width = '100%', // This is now valid
  stacked = false
}: ChartProps) {
  // Ensure width is always defined and valid for ResponsiveContainer
  const containerWidth = width ?? '100%';

  const renderContent = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width={containerWidth} height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.isArray(dataKey) ? (
                dataKey.map((key, index) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={colors[index % colors.length]} 
                    stackId={stacked ? "a" : undefined}
                  />
                ))
              ) : dataKey ? (
                <Bar dataKey={dataKey} fill={colors[0]} />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width={width} height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={valueKey}
                nameKey={nameKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width={width} height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.isArray(dataKey) ? (
                dataKey.map((key, index) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={colors[index % colors.length]} 
                    activeDot={{ r: 8 }} 
                  />
                ))
              ) : (
                <Line type="monotone" dataKey={dataKey} stroke={colors[0]} activeDot={{ r: 8 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
