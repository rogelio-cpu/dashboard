import { Card, StatusDot } from './UI';
import type { DashboardData } from '../hooks/useDashboardData';

interface HistoryTableProps {
    data: DashboardData[];
}

export const HistoryTable = ({ data }: HistoryTableProps) => {
    // Take last 10 records and reverse them to show newest first
    const history = [...data].reverse().slice(0, 10);

    return (
        <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold dark:text-white">Historique des Relevés (10 derniers)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-200/50 dark:bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Heure</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrée (L/min)</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sortie (L/min)</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Perte (L/min)</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {history.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium dark:text-slate-300">{row.timestamp}</td>
                                <td className="px-6 py-4 text-sm dark:text-slate-400">{row.flow_up}</td>
                                <td className="px-6 py-4 text-sm dark:text-slate-400">{row.flow_down}</td>
                                <td className={`px-6 py-4 text-sm font-semibold ${row.loss > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {row.loss}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={row.status} />
                                        <span className="text-xs capitalize dark:text-slate-500">{row.status}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                    En attente de données...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
