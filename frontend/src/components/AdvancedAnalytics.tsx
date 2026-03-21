/**
 * Advanced Analytics Visualizations
 * Custom chart components for enhanced data insights
 */

import React from 'react';
import {
  ScatterChart,
  Scatter,
  Heatmap,
  Sankey,
  Sink,
  Source,
  Link,
  TreeMap,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

/**
 * HEATMAP: Delivery Density by Zone
 * Shows geographical hotspots of delivery activity
 */
export const DeliveryHeatmap: React.FC<{ data: any }> = ({ data }) => {
  const heatmapData = [
    { zone: 'Downtown', hour: '9-10', density: 85 },
    { zone: 'Downtown', hour: '10-11', density: 92 },
    { zone: 'Downtown', hour: '11-12', density: 78 },
    { zone: 'Suburbs', hour: '9-10', density: 45 },
    { zone: 'Suburbs', hour: '10-11', density: 62 },
    { zone: 'Suburbs', hour: '11-12', density: 58 },
    { zone: 'Industrial', hour: '9-10', density: 72 },
    { zone: 'Industrial', hour: '10-11', density: 88 },
    { zone: 'Industrial', hour: '11-12', density: 95 },
  ];

  return (
    <div className="chart-container">
      <h3>Delivery Density Heatmap (by Zone & Hour)</h3>
      <div
        style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        <table style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th>Zone \ Hour</th>
              <th>9-10</th>
              <th>10-11</th>
              <th>11-12</th>
            </tr>
          </thead>
          <tbody>
            {['Downtown', 'Suburbs', 'Industrial'].map((zone) => (
              <tr key={zone}>
                <td style={{ fontWeight: 600 }}>{zone}</td>
                {['9-10', '10-11', '11-12'].map((hour) => {
                  const item = heatmapData.find(
                    (d) => d.zone === zone && d.hour === hour
                  );
                  const intensity = (item?.density || 0) / 100;
                  return (
                    <td
                      key={`${zone}-${hour}`}
                      style={{
                        backgroundColor: `rgba(66, 153, 225, ${intensity})`,
                        padding: '10px',
                        textAlign: 'center',
                        color: intensity > 0.5 ? 'white' : 'black',
                        fontWeight: 600,
                      }}
                    >
                      {item?.density}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * SCATTER PLOT: Driver Performance Analysis
 * X-axis: Trips per week | Y-axis: Customer Rating
 * Bubble size: Average delivery time
 */
export const DriverPerformanceScatter: React.FC<{ data: any }> = ({ data }) => {
  const scatterData = [
    { id: 'D01', trips: 45, rating: 4.8, avgTime: 25 },
    { id: 'D02', trips: 32, rating: 4.2, avgTime: 35 },
    { id: 'D03', trips: 52, rating: 4.9, avgTime: 22 },
    { id: 'D04', trips: 28, rating: 3.8, avgTime: 42 },
    { id: 'D05', trips: 48, rating: 4.6, avgTime: 26 },
    { id: 'D06', trips: 35, rating: 4.1, avgTime: 38 },
    { id: 'D07', trips: 55, rating: 4.7, avgTime: 24 },
    { id: 'D08', trips: 25, rating: 3.5, avgTime: 48 },
  ];

  return (
    <div className="chart-container wide">
      <h3>Driver Performance Analysis</h3>
      <p style={{ fontSize: '12px', color: '#718096', marginTop: '0' }}>
        X-axis: Weekly Trips | Y-axis: Customer Rating | Bubble Size: Avg
        Delivery Time (min)
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="trips" name="Trips/Week" unit="/week" />
          <YAxis
            type="number"
            dataKey="rating"
            name="Rating"
            unit="/5"
            domain={[0, 5]}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div
                    style={{
                      backgroundColor: 'white',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
                      {data.id}
                    </p>
                    <p style={{ margin: '0 0 2px 0', fontSize: '12px' }}>
                      Trips: {data.trips}/week
                    </p>
                    <p style={{ margin: '0 0 2px 0', fontSize: '12px' }}>
                      Rating: {data.rating}/5
                    </p>
                    <p style={{ margin: '0', fontSize: '12px' }}>
                      Avg Time: {data.avgTime}min
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Drivers" data={scatterData} fill="#4299E1">
            {scatterData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`rgba(66, 153, 225, ${0.6 + entry.avgTime / 100})`}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * SANKEY DIAGRAM: Invoice Flow
 * Shows payment flow: Issued → Paid / Pending / Overdue
 */
export const InvoiceFlowSankey: React.FC<{ data: any }> = ({ data }) => {
  const nodes = [
    { name: 'Invoices Issued (120)' },
    { name: 'Paid (98)' },
    { name: 'Pending (15)' },
    { name: 'Overdue (7)' },
  ];

  const links = [
    { source: 0, target: 1, value: 98 },
    { source: 0, target: 2, value: 15 },
    { source: 0, target: 3, value: 7 },
  ];

  const COLORS = ['#48BB78', '#F6AD55', '#F56565'];

  return (
    <div className="chart-container wide">
      <h3>Invoice Payment Flow (Sankey)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <Sankey
          data={{
            nodes: nodes,
            links: links,
          }}
          node={{ fill: '#4299E1', fillOpacity: 1 }}
          link={{ stroke: '#d9d9d9', strokeOpacity: 0.3 }}
          nodePadding={200}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
        {[
          { label: 'Paid', value: 98, color: '#48BB78' },
          { label: 'Pending', value: 15, color: '#F6AD55' },
          { label: 'Overdue', value: 7, color: '#F56565' },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: item.color,
              }}
            />
            <span style={{ fontSize: '12px' }}>
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * TREEMAP: Cost Breakdown
 * Visualizes cost distribution across categories
 */
export const CostBreakdownTreemap: React.FC<{ data: any }> = ({ data }) => {
  const treemapData = [
    { name: 'Fuel Cost', value: 35000 },
    { name: 'Driver Salaries', value: 45000 },
    { name: 'Vehicle Maintenance', value: 12000 },
    { name: 'Insurance', value: 8000 },
    { name: 'Technology', value: 5000 },
  ];

  const COLORS = ['#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#F56565'];

  return (
    <div className="chart-container">
      <h3>Cost Breakdown (Treemap)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <TreeMap
          data={treemapData}
          dataKey="value"
          stroke="#fff"
          fill="#8884d8"
          isAnimationActive={true}
        >
          {treemapData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
            }}
            formatter={(value) => `$${value.toLocaleString()}`}
          />
        </TreeMap>
      </ResponsiveContainer>
      <div
        style={{
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {treemapData.map((item, idx) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: COLORS[idx % COLORS.length],
              }}
            />
            <span>
              {item.name}: ${item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * GAUGE CHART: KPI Speedometer
 * Shows performance metrics as gauges (0-100)
 */
export const KPIGauges: React.FC<{ data: any }> = ({ data }) => {
  const gauges = [
    { label: 'On-Time Delivery', value: 94 },
    { label: 'Customer Satisfaction', value: 87 },
    { label: 'Fuel Efficiency', value: 79 },
    { label: 'System Uptime', value: 99.9 },
  ];

  const getColor = (value: number) => {
    if (value >= 90) return '#48BB78';
    if (value >= 75) return '#F6AD55';
    return '#F56565';
  };

  return (
    <div>
      <h3>KPI Speedometers</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
        }}
      >
        {gauges.map((gauge) => (
          <div
            key={gauge.label}
            style={{
              textAlign: 'center',
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 12px',
                borderRadius: '50%',
                background: `conic-gradient(${getColor(gauge.value)} ${
                  gauge.value
                }%, #e2e8f0 0%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a202c',
              }}
            >
              {gauge.value}
              {gauge.value === 99.9 ? '' : '%'}
            </div>
            <p
              style={{
                margin: '0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4a5568',
              }}
            >
              {gauge.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ADVANCED TIME SERIES: Multi-metric comparison
 * Displays multiple metrics with dual Y-axes and trend lines
 */
export const AdvancedTimeSeries: React.FC<{ data: any }> = ({ data }) => {
  const timeSeriesData = [
    { date: 'Week 1', trips: 125, revenue: 15000, satisfaction: 4.6 },
    { date: 'Week 2', trips: 145, revenue: 18500, satisfaction: 4.7 },
    { date: 'Week 3', trips: 132, revenue: 16800, satisfaction: 4.5 },
    { date: 'Week 4', trips: 158, revenue: 20200, satisfaction: 4.8 },
    { date: 'Week 5', trips: 168, revenue: 21500, satisfaction: 4.9 },
  ];

  return (
    <div className="chart-container wide">
      <h3>Advanced Time Series Analysis</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              yAxisId="left"
              label={{ value: 'Trips', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: 'Revenue ($)',
                angle: 90,
                position: 'insideRight',
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="trips"
              stroke="#4299E1"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#48BB78"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  DeliveryHeatmap,
  DriverPerformanceScatter,
  InvoiceFlowSankey,
  CostBreakdownTreemap,
  KPIGauges,
  AdvancedTimeSeries,
};
