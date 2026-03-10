import { useEffect, useState } from 'react';
import { healthService } from '../services/health.service';
import { Activity, Database, HardDrive, Cpu } from 'lucide-react';
import type { HealthInfo, HealthMemory, HealthDb } from '../types';

export default function Dashboard() {
  const [info, setInfo] = useState<HealthInfo | null>(null);
  const [memory, setMemory] = useState<HealthMemory | null>(null);
  const [db, setDb] = useState<HealthDb | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      healthService.info(),
      healthService.memoryMetrics(),
      healthService.dbMetrics(),
    ]).then(([infoRes, memRes, dbRes]) => {
      if (infoRes.status === 'fulfilled') setInfo(infoRes.value.data.data || infoRes.value.data);
      if (memRes.status === 'fulfilled') setMemory(memRes.value.data.data || memRes.value.data);
      if (dbRes.status === 'fulfilled') setDb(dbRes.value.data.data || dbRes.value.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Estado',
      value: info?.status || 'OK',
      icon: Activity,
      color: 'bg-green-100 text-green-700',
    },
    {
      title: 'Node.js',
      value: info?.node || '-',
      icon: Cpu,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Memoria RSS',
      value: memory?.memory?.rss || '-',
      icon: HardDrive,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Base de datos',
      value: db?.status || '-',
      icon: Database,
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-lg font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {info && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Información del sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">App</span>
              <p className="font-medium">{info.app as string || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Uptime</span>
              <p className="font-medium">{info.uptime || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">PID</span>
              <p className="font-medium">{info.pid || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Timestamp</span>
              <p className="font-medium">
                {info.timestamp ? new Date(info.timestamp).toLocaleString('es') : '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
