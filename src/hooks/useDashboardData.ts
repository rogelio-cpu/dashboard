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
        let lastTime = Date.now();
        let cumulativeVolume = 0;

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
                const now = Date.now();
                const durationSeconds = (now - lastTime) / 1000;
                lastTime = now;

                const flow_up_L_min = 10 + Math.random() * 5;
                const isLeaking = Math.random() > 0.9;
                const flow_down_L_min = isLeaking
                    ? flow_up_L_min - (0.35 + Math.random() * 0.6)
                    : flow_up_L_min - (Math.random() * 0.2);

                let loss_ml_min = (flow_up_L_min - flow_down_L_min) * 1000;
                if (loss_ml_min < 0) loss_ml_min = 0;

                let status: 'normal' | 'warning' | 'critical' = 'normal';
                if (loss_ml_min <= 300) {
                    loss_ml_min = 0;
                    status = 'normal';
                    cumulativeVolume = 0;
                } else if (loss_ml_min <= 800) {
                    status = 'warning';
                } else {
                    status = 'critical';
                }

                if (status !== 'normal') {
                    cumulativeVolume += (loss_ml_min * durationSeconds) / 60;
                }

                const newDataPoint: DashboardData = {
                    timestamp: new Date().toLocaleTimeString(),
                    flow_up: +(flow_up_L_min * 1000).toFixed(0),
                    flow_down: +(flow_down_L_min * 1000).toFixed(0),
                    loss: +cumulativeVolume.toFixed(1),
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
