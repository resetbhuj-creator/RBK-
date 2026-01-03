import React, { useState, useMemo } from 'react';
import { Voucher, Task, TaskPriority } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

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
  vouchers: Voucher[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onViewVoucher: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeCompany, vouchers, tasks, setTasks, onViewVoucher }) => {
  const symbol = activeCompany?.currencyConfig?.symbol || '$';
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');

  const filteredTasks = useMemo(() => {
    if (priorityFilter === 'All') return tasks;
    return tasks.filter(t => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  const financialHealth = useMemo(() => {
    const revenue = vouchers.filter(v => v.type === 'Sales').reduce((acc, v) => acc + v.amount, 0);
    const expenses = vouchers.filter(v => v.type === 'Purchase' || v.type === 'Payment').reduce((acc, v) => acc + v.amount, 0);
    const cash = vouchers.filter(v => v.type === 'Receipt').reduce((acc, v) => acc + v.amount, 0);
    
    // Quick ratio calculation (mocked based on available data)
    const ratio = expenses > 0 ? (cash / (expenses * 0.4)).toFixed(2) : '1.00';
    return { revenue, expenses, ratio };
  }, [vouchers]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle,
      dueDate: newTaskDueDate,
      priority: 'Medium',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t));
  };

  const isOverdue = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Operational Intel</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Node: <span className="text-indigo-600">{activeCompany?.name || '---'}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right border-r border-slate-200 pr-4">
            <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Working Period</div>
            <div className="text-xs font-black text-slate-600">{activeCompany?.years?.[activeCompany.years.length - 1] || 'N/A'}</div>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-slate-500">Gateway Status: Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `${symbol}${financialHealth.revenue.toLocaleString()}`, trend: '+12.5%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Unposted Queue', value: vouchers.filter(v => v.status === 'Draft').length.toString(), trend: '-2.4%', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Liquidity Ratio', value: financialHealth.ratio, trend: 'Optimal', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Reconciliation', value: '94.2%', trend: '+0.8%', color: 'text-indigo-500', bg: 'bg-indigo-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">{stat.label}</span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg ${stat.bg} ${stat.color} border border-current opacity-60`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-black text-slate-800 italic tracking-tighter tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[400px] relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Growth Velocity</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Outward supply vs operational burn</p>
              </div>
              <div className="flex space-x-2">
                 <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[9px] font-black text-indigo-600 border border-indigo-100">REV</div>
                 <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 border border-slate-200">EXP</div>
              </div>
            </div>
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 900 }}
                    formatter={(value: any) => [`${symbol}${value}`, 'Vol']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#cbd5e1" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-[0.03] -mr-32 -mt-32"></div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[450px]">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg transform -rotate-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                 </div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Verification Registry</h3>
              </div>
              <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline underline-offset-4 decoration-indigo-200 tracking-widest">Audit Full Stream</button>
            </div>
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left">
                <thead className="bg-white/50 text-slate-400 uppercase text-[9px] font-black sticky top-0 border-b border-slate-100 backdrop-blur-md">
                  <tr>
                    <th className="px-10 py-5">Txn Hash</th>
                    <th className="px-10 py-5">Counterparty Node</th>
                    <th className="px-10 py-5">Type</th>
                    <th className="px-10 py-5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vouchers.slice(0, 10).map((v) => (
                    <tr 
                      key={v.id} 
                      onClick={() => onViewVoucher(v.id)}
                      className="hover:bg-indigo-50/50 transition-all cursor-pointer group"
                    >
                      <td className="px-10 py-5 font-mono text-[11px] text-indigo-600 font-black tracking-tighter group-hover:translate-x-1 transition-transform">#{v.id}</td>
                      <td className="px-10 py-5 font-black text-slate-700 text-xs truncate max-w-[150px] italic uppercase">{v.party}</td>
                      <td className="px-10 py-5">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {v.type}
                         </span>
                      </td>
                      <td className="px-10 py-5 font-black text-slate-900 text-sm tabular-nums tracking-tighter text-right">{symbol}{v.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col h-[350px] text-white relative overflow-hidden group">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-indigo-400 relative z-10">Sector Partition</h3>
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{name:'B2B', value: 400}, {name:'Retail', value: 300}, {name:'E-Com', value: 300}, {name:'Misc', value: 200}]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24 group-hover:opacity-20 transition-opacity"></div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center">
                 <div className="w-1.5 h-4 bg-indigo-600 rounded-full mr-3"></div>
                 Mission Control
               </h3>
               <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">{tasks.filter(t => t.status === 'Pending').length} Pending</span>
            </div>

            <div className="flex space-x-1 mb-8 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
              {(['All', 'High', 'Medium', 'Low'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    priorityFilter === filter 
                      ? 'bg-white text-indigo-600 shadow-lg border border-slate-100' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar space-y-4 pr-2">
              {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                const overdue = isOverdue(task.dueDate) && task.status === 'Pending';
                return (
                  <div 
                    key={task.id} 
                    className={`p-6 rounded-[2rem] border transition-all relative group ${task.status === 'Completed' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xl'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 hover:border-indigo-500 hover:scale-110'}`}
                        >
                          {task.status === 'Completed' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <div>
                          <div className={`text-[12px] font-black tracking-tight leading-tight italic uppercase ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </div>
                          <div className="flex items-center space-x-3 mt-3">
                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border flex items-center ${overdue ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                              {formatDueDate(task.dueDate)}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'text-rose-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-slate-400'}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <div className="w-16 h-16 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 grayscale">🏙️</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">No matching tasks in buffer</p>
                </div>
              )}
            </div>

            <form onSubmit={addTask} className="mt-8 space-y-3">
              <input 
                type="text" 
                placeholder="Queue new action item..." 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
              />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl border-b-4 border-slate-950">Push to Queue</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;