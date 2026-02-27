import { useState, useEffect } from 'react';

export interface DashboardData {
    timestamp: string;
    flow_up: number;
    flow_down: number;
    loss: number;
    status: 'normal' | 'warning' | 'critical';
}

const API_URL = import.meta.env.VITE_API_URL || '/api/history';

export const useDashboardData = () => {
    const [data, setData] = useState<DashboardData[]>([]);
    const [current, setCurrent] = useState<DashboardData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) {
                    const history: DashboardData[] = await response.json();
                    if (history.length > 0) {
                        setData(history);
                        setCurrent(history[history.length - 1]);
                        return;
                    }
                }
                throw new Error('API not available, using simulation');
            } catch (error) {
                // FALLBACK TO SIMULATION if API fails
                const flow_up = +(10 + Math.random() * 5).toFixed(2);
                const isLeaking = Math.random() > 0.9;
                const flow_down = isLeaking
                    ? +(flow_up - (1 + Math.random() * 2)).toFixed(2)
                    : +(flow_up - (Math.random() * 0.2)).toFixed(2);

                const loss = +(flow_up - flow_down).toFixed(2);
                const status = loss > 0.8 ? 'critical' : (loss > 0.3 ? 'warning' : 'normal');

                const newDataPoint: DashboardData = {
                    timestamp: new Date().toLocaleTimeString(),
                    flow_up,
                    flow_down,
                    loss,
                    status,
                };

                setCurrent(newDataPoint);
                setData(prev => [...prev.slice(-19), newDataPoint]);
            }
        };

        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    return { data, current };
};
