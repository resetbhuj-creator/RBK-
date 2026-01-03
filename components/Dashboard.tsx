import React, { useState } from 'react';
import { Voucher, Task, TaskPriority } from '../types';
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
  vouchers: Voucher[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onViewVoucher: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeCompany, vouchers, tasks, setTasks, onViewVoucher }) => {
  const symbol = activeCompany?.currencyConfig?.symbol || '$';
  
  // Quick Add State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

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
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Growth Velocity</h3>
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

          {/* Verification Registry */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[350px]">
            <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Verification Registry</h3>
            </div>
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left">
                <thead className="bg-white/50 text-slate-400 uppercase text-[8px] font-black sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-2.5">Txn Hash</th>
                    <th className="px-6 py-2.5">Party Node</th>
                    <th className="px-6 py-2.5">Value</th>
                    <th className="px-6 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vouchers.slice(0, 10).map((v) => (
                    <tr 
                      key={v.id} 
                      onClick={() => onViewVoucher(v.id)}
                      className="hover:bg-indigo-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-3 font-mono text-[10px] text-indigo-600 font-black tracking-tighter group-hover:underline">#{v.id}</td>
                      <td className="px-6 py-3 font-black text-slate-700 text-[10px] truncate max-w-[120px] italic uppercase">{v.party}</td>
                      <td className="px-6 py-3 font-black text-slate-900 text-xs tabular-nums tracking-tighter">{symbol}{v.amount.toLocaleString()}</td>
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

        <div className="space-y-4">
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

          {/* Mission Control: Tasks Widget */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-[416px]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center">
                 <div className="w-1.5 h-4 bg-indigo-600 rounded-full mr-2"></div>
                 Mission Control
               </h3>
               <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{tasks.filter(t => t.status === 'Pending').length} Pending</span>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={addTask} className="mb-6 space-y-2">
              <input 
                type="text" 
                placeholder="New action item..." 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
              />
              <div className="flex space-x-2">
                <input 
                  type="date" 
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">Add</button>
              </div>
            </form>

            {/* Task List */}
            <div className="flex-1 overflow-auto custom-scrollbar space-y-3 pr-2">
              {tasks.length > 0 ? tasks.map((task) => {
                const overdue = isOverdue(task.dueDate) && task.status === 'Pending';
                return (
                  <div 
                    key={task.id} 
                    className={`p-4 rounded-2xl border transition-all relative group ${task.status === 'Completed' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500'}`}
                        >
                          {task.status === 'Completed' && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <div>
                          <div className={`text-[11px] font-black tracking-tight leading-tight italic uppercase ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border flex items-center ${overdue ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                              <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {formatDueDate(task.dueDate)}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'text-rose-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-slate-400'}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No Active Tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;