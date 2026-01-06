import React, { useState, useMemo } from 'react';
import { Voucher, Task, TaskPriority } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

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

type SortMode = 'PRIORITY_DESC' | 'DUE_DATE' | 'NEWEST';

const Dashboard: React.FC<DashboardProps> = ({ activeCompany, vouchers, tasks, setTasks, onViewVoucher }) => {
  const symbol = activeCompany?.currencyConfig?.symbol || '$';
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [sortMode, setSortMode] = useState<SortMode>('PRIORITY_DESC');

  const priorityWeight: Record<string, number> = {
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  const filteredTasks = useMemo(() => {
    let result = priorityFilter === 'All' 
      ? [...tasks] 
      : tasks.filter(t => t.priority === priorityFilter);

    result.sort((a, b) => {
      if (sortMode === 'PRIORITY_DESC') {
        const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (weightDiff !== 0) return weightDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortMode === 'DUE_DATE') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortMode === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    
    return result;
  }, [tasks, priorityFilter, sortMode]);

  const financialHealth = useMemo(() => {
    const revenue = vouchers.filter(v => v.type === 'Sales').reduce((acc, v) => acc + v.amount, 0);
    const expenses = vouchers.filter(v => v.type === 'Purchase' || v.type === 'Payment').reduce((acc, v) => acc + v.amount, 0);
    const cash = vouchers.filter(v => v.type === 'Receipt').reduce((acc, v) => acc + v.amount, 0);
    
    // Liquidity Ratio Calculation Mock (Current Assets / Current Liabilities)
    const mockAssets = 150000 + revenue;
    const mockLiabilities = 45000 + expenses;
    const liquidityRatio = (mockAssets / mockLiabilities).toFixed(2);

    // Reconciliation Status Calculation
    const reconVch = vouchers.filter(v => ['Payment', 'Receipt', 'Contra'].includes(v.type));
    const reconciledCount = reconVch.filter(v => v.isReconciled).length;
    const reconStatus = reconVch.length > 0 ? Math.round((reconciledCount / reconVch.length) * 100) : 0;

    return { revenue, expenses, liquidityRatio, reconStatus };
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Operational Intel</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Active Node: <span className="text-indigo-600">{activeCompany?.name || '---'}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-slate-500">Gateway Status: Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `${symbol}${financialHealth.revenue.toLocaleString()}`, trend: '+12.5%', color: 'text-emerald-500', bg: 'bg-emerald-50', bar: false },
          { label: 'Liquidity Ratio', value: financialHealth.liquidityRatio, trend: 'Optimal', color: 'text-blue-500', bg: 'bg-blue-50', bar: false },
          { label: 'Reconciliation', value: `${financialHealth.reconStatus}%`, trend: '+0.8%', color: 'text-indigo-500', bg: 'bg-indigo-50', bar: true, progress: financialHealth.reconStatus },
          { label: 'Draft Buffer', value: vouchers.filter(v => v.status === 'Draft').length.toString(), trend: 'Queue', color: 'text-amber-500', bg: 'bg-amber-50', bar: false }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 group flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">{stat.label}</span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg ${stat.bg} ${stat.color} border border-current opacity-60`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-black text-slate-800 italic tracking-tighter tabular-nums">{stat.value}</div>
            {stat.bar && (
              <div className="mt-6">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div className={`h-full ${stat.color.replace('text', 'bg')} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]`} style={{ width: `${stat.progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[400px] relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Growth Velocity</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Outward supply vs operational burn</p>
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
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#cbd5e1" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] mb-8">Mission Control</h3>
            <div className="flex-1 overflow-auto custom-scrollbar space-y-4">
              {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-800 truncate">{task.title}</div>
                    <div className="text-[8px] font-bold text-indigo-600 mt-1 uppercase">{formatDueDate(task.dueDate)}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                </div>
              )) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                    <p className="text-[10px] font-black uppercase tracking-widest">Queue Clear</p>
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
