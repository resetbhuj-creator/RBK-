import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const data = [
  { name: 'Mon', revenue: 4000, expenses: 2400 },
  { name: 'Tue', revenue: 3000, expenses: 1398 },
  { name: 'Wed', revenue: 2000, expenses: 9800 },
  { name: 'Thu', revenue: 2780, expenses: 3908 },
  { name: 'Fri', revenue: 1890, expenses: 4800 },
  { name: 'Sat', revenue: 2390, expenses: 3800 },
  { name: 'Sun', revenue: 3490, expenses: 4300 },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

interface DashboardProps {
  activeCompany?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ activeCompany }) => {
  const getCurrencySymbol = () => {
    if (!activeCompany?.currency) return '$';
    const match = activeCompany.currency.match(/\(([^)]+)\)/);
    return match ? match[1] : activeCompany.currency.substring(0, 3);
  };

  const symbol = getCurrencySymbol();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">Operational Intel</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Node: <span className="text-indigo-600">{activeCompany?.name || '---'}</span></p>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Working Period</div>
          <div className="text-xs font-black text-slate-600">{activeCompany?.years?.[activeCompany.years.length - 1] || 'N/A'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue (7D)', value: `${symbol}128,430`, trend: '+12.5%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Unposted Queue', value: '43', trend: '-2.4%', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Active Personnel', value: '1,240', trend: '+5.1%', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Procurement Gap', value: '94.2%', trend: '+0.8%', color: 'text-indigo-500', bg: 'bg-indigo-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-100">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${stat.bg} ${stat.color}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-xl font-black text-slate-800 italic tracking-tighter tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Growth Velocity</h3>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option>Cycle: 7D</option>
              <option>Cycle: 30D</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                  formatter={(value: any) => [`${symbol}${value}`, 'Vol']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Channel Partition</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 4)}>
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => [value, 'Vol']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {['Sales', 'Service', 'Other', 'Misc'].map((label, i) => (
              <div key={i} className="flex items-center space-x-2 text-[9px] font-bold uppercase text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[300px]">
        <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Verification Registry</h3>
          <button className="text-indigo-600 text-[10px] font-black uppercase hover:underline underline-offset-4">Full Log</button>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left">
            <thead className="bg-white/50 text-slate-400 uppercase text-[8px] font-black sticky top-0 border-b border-slate-100">
              <tr>
                <th className="px-6 py-2.5">Txn Hash</th>
                <th className="px-6 py-2.5">Domain</th>
                <th className="px-6 py-2.5">Value</th>
                <th className="px-6 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <tr key={item} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3 font-mono text-[10px] text-slate-500 font-black tracking-tighter">#TXN-0982{item}</td>
                  <td className="px-6 py-3 font-black text-slate-700 text-[10px] truncate max-w-[120px] italic uppercase">{activeCompany?.name || '---'}</td>
                  <td className="px-6 py-3 font-black text-slate-900 text-xs tabular-nums tracking-tighter">${(2400 * item).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase border border-emerald-100 shadow-sm">Verified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;