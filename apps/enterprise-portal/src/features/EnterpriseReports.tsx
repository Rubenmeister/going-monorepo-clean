import { EnterpriseLayout } from '../components/EnterpriseLayout';

const MOCK_STATS = [
  { label: 'Total Gastado', value: '$24,580', change: '+15%', period: 'vs mes anterior' },
  { label: 'Viajes Realizados', value: '412', change: '+8%', period: 'vs mes anterior' },
  { label: 'Costo Promedio', value: '$59.66', change: '-2%', period: 'vs mes anterior' },
  { label: 'Centros de Costo', value: '8', change: '0%', period: 'sin cambios' },
];

const COST_CENTER_SPENDING = [
  { name: 'Gerencia General', spent: 12450, color: '#1e40af' },
  { name: 'Ventas', spent: 6320, color: '#3b82f6' },
  { name: 'Marketing', spent: 3180, color: '#60a5fa' },
  { name: 'Operaciones', spent: 1870, color: '#93c5fd' },
  { name: 'Otros', spent: 760, color: '#cbd5e1' },
];

export default function EnterpriseReports() {
  const maxSpend = Math.max(...COST_CENTER_SPENDING.map(s => s.spent));

  return (
    <EnterpriseLayout activeItem="reports">
      {/* Header */}
      <header className="top-header">
        <h1 className="page-title">Reportes</h1>
        <div className="header-actions">
          <input type="month" className="form-input text-sm" defaultValue="2024-12" />
          <button className="btn btn-secondary btn-sm">📥 Descargar PDF</button>
        </div>
      </header>

      {/* Page Content */}
      <div className="page-content">
        {/* Summary Stats */}
        <div className="stats-grid">
          {MOCK_STATS.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.change.startsWith('+') ? 'up' : stat.change.startsWith('-') ? 'down' : ''}`}>
                {stat.change} {stat.period}
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* Spending by Cost Center */}
          <div className="data-card">
            <div className="card-header">
              <h3 className="card-title">Gasto por Centro de Costo</h3>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {COST_CENTER_SPENDING.map((cc, i) => {
                  const pct = (cc.spent / maxSpend) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">{cc.name}</span>
                        <span className="text-sm font-bold text-slate-900">${cc.spent.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${pct}%`, 
                            backgroundColor: cc.color,
                            boxShadow: '0 0 10px rgba(0,0,0,0.05)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Monthly Trend - SVG Sparkline */}
          <div className="data-card">
            <div className="card-header">
              <h3 className="card-title">Tendencia de Gastos (6 meses)</h3>
            </div>
            <div className="card-body">
              <div className="h-64 flex flex-col justify-end">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  <path
                    d="M 0 180 Q 80 160 160 100 T 320 60 L 400 20 L 400 200 L 0 200 Z"
                    fill="url(#gradient)"
                    opacity="0.2"
                  />
                  <path
                    d="M 0 180 Q 80 160 160 100 T 320 60 L 400 20"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e40af" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                  
                  {/* Points */}
                  <circle cx="0" cy="180" r="4" fill="#1e40af" />
                  <circle cx="160" cy="100" r="4" fill="#1e40af" />
                  <circle cx="320" cy="60" r="4" fill="#1e40af" />
                  <circle cx="400" cy="20" r="4" fill="#1e40af" />
                </svg>
                
                <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium">
                  <span>JUL</span>
                  <span>AGO</span>
                  <span>SEP</span>
                  <span>OCT</span>
                  <span>NOV</span>
                  <span>DIC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
