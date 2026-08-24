import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import theme from '../theme';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        minWidth: '150px'
      }}>
        <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color || entry.payload.fill }}></span>
            <span>{entry.name}: <strong style={{ color: '#0f172a' }}>{entry.value}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardMetrics({ data, type = 'status', barName = 'Count', title, pieTitle, chartType = 'both', height = 300 }) {
  const COLORS = {
    'Pending': '#E3A008', // More vibrant orange/gold
    'Approved': '#10B981', // Vibrant emerald
    'Completed': '#3B82F6', // Vibrant blue
    'Published': '#0EA5E9', // Sky blue
    'Rejected': '#EF4444', // Red
    'Total': theme.colors.maroon,
    'Academic': '#6366F1', // Indigo
    'Cultural': '#F43F5E', // Rose
    'Sports': '#10B981', // Emerald
    'University': '#8B5CF6', // Purple
    'Department': '#F59E0B' // Amber
  };

  const getColor = (name, index) => {
    if (COLORS[name]) return COLORS[name];
    const palette = [
      '#6366F1', '#3B82F6', '#14B8A6', '#10B981', '#84CC16',
      '#F59E0B', '#F97316', '#EF4444', '#EC4899', '#D946EF',
      '#8B5CF6', '#64748B'
    ];
    return palette[index % palette.length];
  };

  const filteredData = data 
    ? data.filter(d => type === 'category' ? d.count > 0 : true).map((entry, index) => ({
        ...entry,
        fill: getColor(entry.name, index)
      }))
    : [];

  if (filteredData.length === 0 || (type === 'category' && filteredData.every(d => d.count === 0))) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888', background: '#fff', borderRadius: '12px' }}>
        No data available for charts.
      </div>
    );
  }

  return (
    <div style={styles.metricsContainer}>
      {(chartType === 'both' || chartType === 'bar') && (
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>{title || (type === 'status' ? 'Events by Status' : 'Overview Breakdown')}</h3>
          <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={false} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} height={10} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Bar 
                  dataKey="count" 
                  name={barName} 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500} 
                  animationEasing="ease-out"
                  maxBarSize={60}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(chartType === 'both' || chartType === 'pie') && (
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>{pieTitle || 'Distribution'}</h3>
          <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart data={filteredData}>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={6}
                  dataKey="count"
                  label={false}
                  labelLine={false}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  wrapperStyle={{ paddingTop: '10px', maxHeight: '100px', overflowY: 'auto' }} 
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  metricsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1.5rem',
    width: '100%'
  },
  chartCard: {
    flex: 1,
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  chartTitle: {
    margin: '0 0 1.5rem',
    fontSize: '1.15rem',
    color: '#334155',
    fontWeight: '700',
    letterSpacing: '-0.01em'
  }
};
