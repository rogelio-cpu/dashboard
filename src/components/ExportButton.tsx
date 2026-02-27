import { Download } from 'lucide-react';
import type { DashboardData } from '../hooks/useDashboardData';

interface ExportButtonProps {
    data: DashboardData[];
}

export const ExportButton = ({ data }: ExportButtonProps) => {
    const exportToCSV = () => {
        const headers = ['Timestamp', 'Flow Up (ml/min)', 'Flow Down (ml/min)', 'Loss (ml/min)', 'Status'];
        const csvRows = [
            headers.join(','),
            ...data.map(row => [
                row.timestamp,
                row.flow_up,
                row.flow_down,
                row.loss,
                row.status
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `aquaguard_data_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-white/20 transition-all text-sm font-medium dark:text-white"
        >
            <Download className="w-4 h-4" />
            Exporter CSV
        </button>
    );
};
