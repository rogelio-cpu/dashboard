import { useState } from 'react'
import { Droplet, Moon, Sun, TrendingUp, ShieldAlert, Activity } from 'lucide-react'
import { useDashboardData } from './hooks/useDashboardData'
import { KPI } from './components/UI'
import { RealTimeChart, LossChart } from './components/Charts'
import { ExportButton } from './components/ExportButton'
import { formatFlow, formatVolume } from './utils/formatters'

import { HistoryTable } from './components/HistoryTable'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const { data, current } = useDashboardData()

  const efficiency = current ? ((current.flow_down / current.flow_up) * 100).toFixed(1) : '100'
  const flowUpFmt = formatFlow(current?.flow_up || 0)
  const flowDownFmt = formatFlow(current?.flow_down || 0)
  const lossFmt = formatVolume(current?.loss || 0)

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-midnight transition-colors duration-300 p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Droplet className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-white tracking-tight">AquaGuard</h1>
              <p className="text-sm text-slate-500 font-medium">Monitoring Intelligence & Leak Detection</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ExportButton data={data} />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full glass-card hover:bg-white/20 transition-all shadow-lg"
            >
              {darkMode ? <Sun className="text-amber-400 w-5 h-5" /> : <Moon className="text-slate-700 w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPI
              label="Flux Entrant"
              value={flowUpFmt.value}
              unit={flowUpFmt.unit}
              icon={<TrendingUp className="w-5 h-5" />}
              status="normal"
            />
            <KPI
              label="Flux Sortant"
              value={flowDownFmt.value}
              unit={flowDownFmt.unit}
              icon={<Activity className="w-5 h-5" />}
              status={current?.status}
            />
            <KPI
              label="Perte en Temps Réel"
              value={lossFmt.value}
              unit={lossFmt.unit}
              icon={<ShieldAlert className="w-5 h-5" />}
              status={current?.status}
            />
            <KPI
              label="Efficacité"
              value={efficiency}
              unit="%"
              status={+efficiency < 90 ? 'critical' : (+efficiency < 95 ? 'warning' : 'normal')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RealTimeChart data={data} />
            </div>
            <div className="flex flex-col gap-6">
              <LossChart data={data} />
              <div className="glass-card p-6 flex-1 flex flex-col justify-center items-center text-center gap-4">
                <div className={`p-4 rounded-full ${current?.status === 'critical' ? 'bg-rose-500/20 animate-pulse' : 'bg-emerald-500/20'}`}>
                  <ShieldAlert className={current?.status === 'critical' ? 'text-rose-500' : 'text-emerald-500'} size={48} />
                </div>
                <div>
                  <h4 className="text-xl font-bold dark:text-white">Statut du Système</h4>
                  <p className="text-slate-500 mt-1">
                    {current?.status === 'critical' ? 'Fuite majeure détectée !' :
                      current?.status === 'warning' ? 'Fuite légère détectée !' : 'Fonctionnement nominal'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <HistoryTable data={data} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
