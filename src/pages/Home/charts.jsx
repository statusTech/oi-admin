import React, { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';

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
export const BarsCard = ({ title, mobileSubtitle, data, color, label, onSelect, loading }) => {
  const config = { count: { label, color } };
  const rows = data.map((d) => ({ ...d, name: d.name ?? formatMonth(d.month) }));
  const hasData = rows.some((r) => r.count > 0);

  return (
    <SectionCard title={title}>
      {mobileSubtitle && <p className="sm:hidden -mt-1 mb-2 text-xs text-oi-text-muted">{mobileSubtitle}</p>}
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

const RING_THICKNESS = 0.16;
const TOP_PADDING = 10;
const MAX_RADIUS = 170;

// Gauge semicircular segmentado (ver docs/grafico-formas-de-pagamento.md).
// Raio calculado pela largura do wrapper, pois o Recharts usa min(largura, altura)/2.
export const StatusPieCard = ({ title, slices, onSelect, loading }) => {
  const wrapperRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [loading]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const config = Object.fromEntries(slices.map((s) => [s.key, { label: s.label, color: s.color }]));
  const data = slices.filter((s) => s.value > 0).map((s) => ({ ...s, fill: s.color }));

  const outerRadius = Math.max(60, Math.min(width / 2 - 8, MAX_RADIUS - TOP_PADDING));
  const innerRadius = outerRadius * (1 - RING_THICKNESS);
  const cornerRadius = (outerRadius - innerRadius) / 2;
  const cy = outerRadius + TOP_PADDING;

  const renderCenter = ({ viewBox }) => {
    const cx = viewBox?.cx ?? width / 2;
    return (
      <text x={cx} y={cy - innerRadius * 0.28} textAnchor="middle">
        <tspan className="fill-oi-text" fontSize={22} fontWeight={700}>
          {total.toLocaleString('pt-BR')}
        </tspan>
        <tspan x={cx} dy={20} className="fill-oi-text-muted" fontSize={12}>
          clientes
        </tspan>
      </text>
    );
  };

  return (
    <SectionCard title={title} className="h-full" bodyClassName="flex-1 justify-center">
      <ChartBody loading={loading} hasData={total > 0}>
        <div ref={wrapperRef} className="flex flex-col gap-4 w-full">
          <ChartContainer
            config={config}
            className="aspect-auto w-full"
            style={{ height: outerRadius + TOP_PADDING * 2 }}
          >
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                startAngle={180}
                endAngle={0}
                cx="50%"
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                cornerRadius={cornerRadius}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((s) => (
                  <Cell key={s.key} fill={s.color} className="cursor-pointer" onClick={() => onSelect?.(s)} />
                ))}
                <Label content={renderCenter} position="center" />
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {slices.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onSelect?.(s)}
                  className="flex items-center gap-2 text-[13px] border-0 bg-transparent cursor-pointer p-0"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-oi-text">{s.label}</span>
                  <span className="text-oi-text-muted tabular-nums">
                    {s.value.toLocaleString('pt-BR')} ({total ? ((s.value / total) * 100).toFixed(1) : '0.0'}%)
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
