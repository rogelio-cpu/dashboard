import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card } from './UI';
import type { DashboardData } from '../hooks/useDashboardData';
import { useState } from 'react';

interface ChartProps {
    data: DashboardData[];
}

export const RealTimeChart = ({ data }: ChartProps) => {
    const [period, setPeriod] = useState<'jour' | 'mois' | 'an'>('jour');

    return (
        <Card className="h-[450px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold dark:text-white tracking-tight">Analyse des Flux</h3>
                <div className="flex bg-slate-200 dark:bg-white/5 p-1 rounded-lg">
                    {(['jour', 'mois', 'an'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${period === p
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit=" L" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="flow_up" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUp)" name="Entrée" />
                        <Area type="monotone" dataKey="flow_down" stroke="#10b981" fillOpacity={1} fill="url(#colorDown)" name="Sortie" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export const LossChart = ({ data }: ChartProps) => {
    return (
        <Card className="h-[300px]">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Perte d'Eau</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                        />
                        <Line type="monotone" dataKey="loss" stroke="#f43f5e" strokeWidth={2} dot={false} name="Perte" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
