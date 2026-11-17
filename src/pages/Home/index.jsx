import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  CalendarClock,
  CalendarX,
  EyeOff,
  Infinity as InfinityIcon,
  QrCode,
  Store,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
} from 'lucide-react';

import { fetchAdminClients } from '@/service/adminClients';
import { clientsListUrl } from '@/utils/clientFilters';
import KpiCard from '@/components/layout/KpiCard';
import { Button } from '@/components/ui/button';
import { BarsCard, StatusPieCard } from './charts';

// Uma cor por métrica (paleta de KPI do design system).
const KPIS = [
  { key: 'total', label: 'Total de clientes', icon: Users, color: '#4C7CD0', filter: null },
  { key: 'active', label: 'Ativos', icon: UserCheck, color: '#22C55E', filter: 'active' },
  { key: 'inactive', label: 'Inativos', icon: UserX, color: '#F05968', filter: 'inactive' },
  { key: 'expired', label: 'Licença vencida', icon: CalendarX, color: '#B22222', filter: 'expired' },
  { key: 'expiring30Days', label: 'Vence em 30 dias', icon: CalendarClock, color: '#FF9843', filter: 'expiring30' },
  { key: 'noExpiry', label: 'Sem vencimento', icon: InfinityIcon, color: '#747474', filter: 'noExpiry' },
  { key: 'withListaPix', label: 'Com Lista PIX', icon: QrCode, color: '#9B59B6', filter: 'listaPix' },
  { key: 'onlyListaPix', label: 'Só Lista PIX', icon: Store, color: '#CD6090', filter: 'onlyListaPix' },
  { key: 'withCashless', label: 'Com cashless', icon: Wallet, color: '#2FD8A0', filter: 'cashless' },
  { key: 'noAccess30Days', label: 'Sem acesso há 30+ dias', icon: EyeOff, color: '#FF7043', filter: 'noAccess30' },
  { key: 'newThisMonth', label: 'Novos no mês', icon: UserPlus, color: '#3B94FF', filter: 'newThisMonth' },
];

const ACCESS_BARS = [
  { key: 'upTo7', name: 'Até 7 dias' },
  { key: 'from8to30', name: '8–30 dias' },
  { key: 'from31to90', name: '31–90 dias' },
  { key: 'over90', name: 'Mais de 90' },
  { key: 'never', name: 'Nunca' },
];

const Home = () => {
  const history = useHistory();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchAdminClients()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const go = (filter) => history.push(clientsListUrl(filter));
  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-oi-border bg-white p-4">
          <span className="text-sm text-destructive">Não foi possível carregar os indicadores.</span>
          <Button size="sm" variant="outline" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPIS.map(({ key, label, icon: Icon, color, filter }) => (
          <KpiCard
            key={key}
            label={label}
            value={kpis ? kpis[key] : '—'}
            icon={<Icon />}
            iconColor={color}
            loading={loading}
            onClick={() => go(filter)}
            ariaLabel={`${label}: ver clientes`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <BarsCard
          title="Novos clientes por mês"
          label="Novos clientes"
          color="#3B94FF"
          loading={loading}
          data={charts?.newClientsByMonth ?? []}
          onSelect={(row) => go(`created:${row.month}`)}
        />
        <BarsCard
          title="Vencimentos nos próximos 6 meses"
          label="Vencimentos"
          color="#FF9843"
          loading={loading}
          data={charts?.expirationsNext6Months ?? []}
          onSelect={(row) => go(`expires:${row.month}`)}
        />
        <StatusPieCard
          title="Ativos x inativos"
          loading={loading}
          slices={[
            { key: 'active', label: 'Ativos', color: '#22C55E', value: charts?.activeVsInactive.active ?? 0 },
            { key: 'inactive', label: 'Inativos', color: '#F05968', value: charts?.activeVsInactive.inactive ?? 0 },
          ]}
          onSelect={(slice) => go(slice.key)}
        />
        <BarsCard
          title="Último acesso"
          label="Clientes"
          color="#4C7CD0"
          loading={loading}
          data={ACCESS_BARS.map((b) => ({
            key: b.key,
            name: b.name,
            count: charts?.byLastAccess[b.key] ?? 0,
          }))}
          onSelect={(row) => go(`access:${row.key}`)}
        />
      </div>
    </div>
  );
};

export default Home;
