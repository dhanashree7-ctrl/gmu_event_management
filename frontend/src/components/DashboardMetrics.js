import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, defs, linearGradient, stop
} from 'recharts';
import theme from '../theme';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        minWidth: '180px'
      }}>
        <p style={{ margin: '0 0 0.75rem', fontWeight: '800', color: '#1e293b', fontSize: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', color: '#475569', fontSize: '0.9rem', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: entry.payload.baseColor || entry.color || entry.payload.fill, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}></span>
                <span style={{ fontWeight: 600 }}>{entry.name}</span>
            </div>
            <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{entry.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = (props) => {
  const { payload } = props;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '1rem', maxHeight: '100px', overflowY: 'auto', padding: '0 10px', width: '100%' }}>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            background: '#f8fafc', padding: '6px 12px', borderRadius: '20px', 
            border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#334155',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s', cursor: 'default'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.payload.baseColor || entry.color, display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></span>
          {entry.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardMetrics({ data, type = 'status', barName = 'Count', title, pieTitle, chartType = 'both', height = 320 }) {
  const PALETTE = [
    { base: '#6366F1', grad: ['#818CF8', '#4F46E5'] }, // Indigo
    { base: '#EC4899', grad: ['#F472B6', '#DB2777'] }, // Pink
    { base: '#10B981', grad: ['#34D399', '#059669'] }, // Emerald
    { base: '#F59E0B', grad: ['#FBBF24', '#D97706'] }, // Amber
    { base: '#3B82F6', grad: ['#60A5FA', '#2563EB'] }, // Blue
    { base: '#8B5CF6', grad: ['#A78BFA', '#7C3AED'] }, // Purple
    { base: '#F43F5E', grad: ['#FB7185', '#E11D48'] }, // Rose
    { base: '#14B8A6', grad: ['#2DD4BF', '#0D9488'] }, // Teal
  ];

  const getColor = (index) => {
    return PALETTE[index % PALETTE.length];
  };

  const filteredData = data 
    ? data.filter(d => type === 'category' ? d.count > 0 : true).map((entry, index) => {
        const colorObj = getColor(index);
        return {
          ...entry,
          baseColor: colorObj.base,
          fill: `url(#colorGrad${index})` // Reference gradient ID
        };
      })
    : [];

  if (filteredData.length === 0 || (type === 'category' && filteredData.every(d => d.count === 0))) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>No Data Available</p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Charts will appear here once data is generated.</p>
      </div>
    );
  }

  // Common gradients defs
  const Gradients = () => (
    <defs>
      {filteredData.map((entry, index) => {
        const colorObj = getColor(index);
        return (
          <linearGradient key={`grad-${index}`} id={`colorGrad${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorObj.grad[0]} stopOpacity={0.9} />
            <stop offset="95%" stopColor={colorObj.grad[1]} stopOpacity={0.9} />
          </linearGradient>
        );
      })}
    </defs>
  );

  return (
    <div style={styles.metricsContainer}>
      {(chartType === 'both' || chartType === 'bar') && (
        <div style={styles.chartCard}>
           <div style={styles.cardHeader}>
             <h3 style={styles.chartTitle}>{title || (type === 'status' ? 'Events by Status' : 'Overview Breakdown')}</h3>
             <div style={styles.chartBadge}>Bar Chart</div>
           </div>
          <div style={{ width: '100%', height: height - 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                <Gradients />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={false} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} tickLine={false} height={10} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                <Legend content={<CustomLegend />} />
                <Bar 
                  dataKey="count" 
                  name={barName} 
                  radius={[8, 8, 0, 0]} 
                  animationDuration={1500} 
                  animationEasing="ease-out"
                  maxBarSize={50}
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
          <div style={styles.cardHeader}>
             <h3 style={styles.chartTitle}>{pieTitle || 'Distribution'}</h3>
             <div style={styles.chartBadge}>Doughnut</div>
           </div>
          <div style={{ width: '100%', height: height - 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart data={filteredData}>
                <Gradients />
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="45%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={4}
                  dataKey="count"
                  label={false}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.1))` }} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
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
    gap: '2rem',
    width: '100%',
    flexWrap: 'wrap'
  },
  chartCard: {
    flex: '1 1 450px',
    background: 'linear-gradient(145deg, #ffffff, #fafafa)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.02)',
    border: '1px solid rgba(255,255,255,0.8)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '1rem'
  },
  chartTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#0f172a',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  chartBadge: {
    background: '#f1f5f9',
    color: '#64748b',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  }
};
