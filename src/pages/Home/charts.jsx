import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import SectionCard from '@/components/layout/SectionCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMonth } from '@/utils/clientFilters';

const HEIGHT = 'aspect-auto h-[240px] w-full';

const Empty = () => (
  <div className="h-[240px] flex items-center justify-center text-oi-text-muted text-[13px]">Sem dados</div>
);

const ChartBody = ({ loading, hasData, children }) => {
  if (loading) return <Skeleton className="h-[240px] w-full rounded-md" />;
  return hasData ? children : <Empty />;
};

// Barras clicáveis: cada barra leva à listagem filtrada.
export const BarsCard = ({ title, data, color, label, onSelect, loading }) => {
  const config = { count: { label, color } };
  const rows = data.map((d) => ({ ...d, name: d.name ?? formatMonth(d.month) }));
  const hasData = rows.some((r) => r.count > 0);

  return (
    <SectionCard title={title}>
      <ChartBody loading={loading} hasData={hasData}>
        <ChartContainer config={config} className={HEIGHT}>
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="name" interval={rows.length > 8 ? 1 : 0} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <ChartTooltip cursor={{ fill: 'rgba(59,148,255,0.06)' }} content={<ChartTooltipContent hideLabel={false} />} />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={(row) => onSelect?.(row.payload ?? row)}
            />
          </BarChart>
        </ChartContainer>
      </ChartBody>
    </SectionCard>
  );
};

// Rosca ativos x inativos; cada fatia leva à listagem filtrada.
export const StatusPieCard = ({ title, slices, onSelect, loading }) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const config = Object.fromEntries(slices.map((s) => [s.key, { label: s.label, color: s.color }]));

  return (
    <SectionCard title={title}>
      <ChartBody loading={loading} hasData={total > 0}>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ChartContainer config={config} className="aspect-square h-[220px] w-[220px] shrink-0">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} />
              <Pie
                data={slices.map((s) => ({ ...s, fill: s.color }))}
                dataKey="value"
                isAnimationActive={false}
                nameKey="key"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} className="cursor-pointer" onClick={() => onSelect?.(s)} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="flex flex-col gap-2 w-full">
            {slices.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onSelect?.(s)}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 border-0 bg-transparent cursor-pointer hover:bg-muted text-left"
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[13px] text-oi-text flex-1">{s.label}</span>
                  <span className="text-[13px] font-semibold tabular-nums text-oi-text">{s.value}</span>
                  <span className="text-xs tabular-nums text-oi-text-muted w-10 text-right">
                    {total ? Math.round((s.value / total) * 100) : 0}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </ChartBody>
    </SectionCard>
  );
};
