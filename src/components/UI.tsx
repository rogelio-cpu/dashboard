import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className }: CardProps) => (
    <div className={cn("glass-card p-6", className)}>
        {children}
    </div>
);

interface StatusDotProps {
    status: 'normal' | 'warning' | 'critical';
}

export const StatusDot = ({ status }: StatusDotProps) => {
    const colors = {
        normal: 'dot-green',
        warning: 'dot-yellow',
        critical: 'dot-red'
    };
    return <div className={cn("status-dot", colors[status])} />;
};

interface KPIProps {
    label: string;
    value: string | number;
    unit?: string;
    status?: 'normal' | 'warning' | 'critical';
    icon?: React.ReactNode;
}

export const KPI = ({ label, value, unit, status = 'normal', icon }: KPIProps) => (
    <Card className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                {icon && <div className="text-blue-500">{icon}</div>}
                <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
            </div>
            <StatusDot status={status} />
        </div>
        <div className="flex items-baseline gap-2">
            <span className={cn(
                "text-4xl font-bold tracking-tight",
                status === 'critical' ? 'text-rose-500' : (status === 'warning' ? 'text-amber-500' : 'dark:text-white')
            )}>
                {value}
            </span>
            {unit && <span className="text-lg font-normal text-slate-500">{unit}</span>}
        </div>
    </Card>
);
