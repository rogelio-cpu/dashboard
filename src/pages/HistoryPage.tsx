import { useState, useEffect } from 'react';
import { HistoryTable } from '../components/HistoryTable';
import type { DashboardData } from '../hooks/useDashboardData';

export const HistoryPage = () => {
    const [data, setData] = useState<DashboardData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllHistory = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || '';
                const response = await fetch(`${API_URL}/api/history/all`);
                if (response.ok) {
                    const history: DashboardData[] = await response.json();
                    setData(history);
                }
            } catch (error) {
                console.error('Failed to fetch complete history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllHistory();
    }, []);

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold dark:text-white mb-2">Historique Complet</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Consultez toutes les données enregistrées par le système AquaGuard depuis la base de données SQLite.
                </p>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <HistoryTable data={data} forceShowAll={true} />
            )}
        </div>
    );
};
