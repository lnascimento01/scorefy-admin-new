'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ChartBarProps<T extends object> {
  data: T[]
  dataKey: keyof T
  nameKey: keyof T
  color?: string
}

export function ChartBar<T extends object>({ data, dataKey, nameKey, color = '#ef4444' }: ChartBarProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
        <XAxis dataKey={nameKey as string} stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={48} />
        <Tooltip
          cursor={{ fill: 'rgba(59,130,246,0.08)' }}
          contentStyle={{
            backgroundColor: 'rgba(15,23,42,0.9)',
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.15)',
            color: '#f8fafc'
          }}
        />
        <Bar dataKey={dataKey as string} fill={color} radius={[12, 12, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
