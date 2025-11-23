'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type LineConfig<T extends object> = {
  dataKey: keyof T
  color: string
  name: string
}

interface ChartLineProps<T extends object> {
  data: T[]
  lines: LineConfig<T>[]
  xKey?: keyof T
}

export function ChartLine<T extends object>({ data, lines, xKey }: ChartLineProps<T>) {
  const horizontalKey = (xKey ?? ('week' as keyof T)) as string
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.2)" strokeDasharray="4 4" />
        <XAxis dataKey={horizontalKey} stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={48} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface-contrast)',
            borderRadius: 12,
            border: '1px solid var(--border-soft)',
            color: 'var(--color-text-primary)'
          }}
        />
        <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} />
        {lines.map((line) => (
          <Line
            key={String(line.dataKey)}
            type="monotone"
            dataKey={line.dataKey as string}
            name={line.name}
            stroke={line.color}
            strokeWidth={3}
            dot={{ stroke: line.color, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
