/**
 * Dashboard Page
 * Main analytics and KPI dashboard
 */

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface ChartDataPoint {
  [key: string]: string | number;
}

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Fetch KPIs
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKPIs,
  } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.get('/api/analytics/kpis/current'),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch KPI history for charts
  const { data: kpiHistory } = useQuery({
    queryKey: ['kpis-history', selectedPeriod],
    queryFn: () =>
      api.get(
        `/api/analytics/kpis/history?days=${
          selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 1
        }`
      ),
  });

  // Fetch reports
  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/api/analytics/reports?limit=10'),
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (reportType: string) =>
      api.post('/api/analytics/reports', {
        type: reportType,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        format: 'PDF',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const kpiCards: KPI[] = [
    {
      label: 'Total Trips',
      value: kpis?.totalTrips || 0,
      change: 12.5,
      trend: 'up',
      icon: <MapPin size={24} />,
      color: '#4299E1',
    },
    {
      label: 'Active Drivers',
      value: kpis?.activeDrivers || 0,
      change: -5.2,
      trend: 'down',
      icon: <Users size={24} />,
      color: '#48BB78',
    },
    {
      label: 'Total Revenue',
      value: `$${((kpis?.totalRevenueThisMonth || 0) / 1000).toFixed(1)}K`,
      change: 23.4,
      trend: 'up',
      icon: <TrendingUp size={24} />,
      color: '#ED8936',
    },
    {
      label: 'Overdue Invoices',
      value: kpis?.totalInvoicesOverdue || 0,
      change: -2.1,
      trend: 'down',
      icon: <FileText size={24} />,
      color: '#F56565',
    },
  ];

  const revenueData: ChartDataPoint[] = [
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 50000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 50000 },
    { month: 'May', revenue: 55000, target: 50000 },
    { month: 'Jun', revenue: 67000, target: 50000 },
  ];

  const tripData: ChartDataPoint[] = [
    { day: 'Mon', trips: 120, distance: 850 },
    { day: 'Tue', trips: 132, distance: 920 },
    { day: 'Wed', trips: 101, distance: 750 },
    { day: 'Thu', trips: 150, distance: 1050 },
    { day: 'Fri', trips: 165, distance: 1100 },
    { day: 'Sat', trips: 95, distance: 650 },
    { day: 'Sun', trips: 85, distance: 600 },
  ];

  const notificationData: ChartDataPoint[] = [
    { name: 'Delivered', value: 3500, color: '#48BB78' },
    { name: 'Read', value: 2800, color: '#4299E1' },
    { name: 'Failed', value: 150, color: '#F56565' },
  ];

  const COLORS = ['#48BB78', '#4299E1', '#F56565'];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your platform overview.</p>
        </div>

        <div className="dashboard-controls">
          <select
            className="period-selector"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            className="refresh-btn"
            onClick={() => refetchKPIs()}
            disabled={kpisLoading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            className="kpi-card"
            style={{ borderLeftColor: kpi.color }}
          >
            <div className="kpi-header">
              <div className="kpi-icon" style={{ color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="kpi-trend">
                {kpi.trend === 'up' ? (
                  <TrendingUp size={16} color="#48BB78" />
                ) : (
                  <TrendingDown size={16} color="#F56565" />
                )}
                <span
                  style={{ color: kpi.trend === 'up' ? '#48BB78' : '#F56565' }}
                >
                  {Math.abs(kpi.change)}%
                </span>
              </div>
            </div>

            <h3>{kpi.label}</h3>
            <p className="kpi-value">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-section">
        {/* Revenue Chart */}
        <div className="chart-container wide">
          <h3>Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4299E1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4299E1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4299E1"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#CBD5E0"
                fillOpacity={0.1}
                fill="#CBD5E0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trip Activity Chart */}
        <div className="chart-container wide">
          <h3>Trip Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tripData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="trips" fill="#4299E1" name="Trips" />
              <Bar
                yAxisId="right"
                dataKey="distance"
                fill="#48BB78"
                name="Distance (km)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Notification Stats */}
        <div className="chart-container">
          <h3>Notification Stats</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={notificationData as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {notificationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports Section */}
      <div className="reports-section">
        <div className="reports-header">
          <h2>Recent Reports</h2>
          <button className="generate-report-btn">
            <FileText size={18} />
            Generate Report
          </button>
        </div>

        {reports?.reports && reports.reports.length > 0 ? (
          <div className="reports-list">
            {reports.reports.map((report: any) => (
              <div key={report.id} className="report-item">
                <div className="report-info">
                  <h4>{report.title}</h4>
                  <p>
                    {new Date(report.startDate).toLocaleDateString()} -{' '}
                    {new Date(report.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="report-stats">
                  <span className="format-badge">{report.format}</span>
                  <span className="record-count">
                    {report.totalRecords} records
                  </span>
                </div>
                <button className="download-btn">
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-reports">
            <FileText size={48} />
            <p>No reports generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
