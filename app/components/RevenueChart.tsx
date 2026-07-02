'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { money } from '@/lib/calculations'

export type RevenuePoint = {
  label: string
  refreshments: number
  lunches: number
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum: number, p: any) => sum + Number(p.value || 0), 0)
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {money(p.value)}
        </div>
      ))}
      <div className="chart-tooltip-total">Total: {money(total)}</div>
    </div>
  )
}

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e6e9f2" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5b6478' }} axisLine={{ stroke: '#e6e9f2' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#5b6478' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => money(v)}
          width={70}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="refreshments" name="Refreshments" stackId="rev" fill="#f59e0b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="lunches" name="Lunch" stackId="rev" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
