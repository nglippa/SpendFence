"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { categoryProgress, formatMoney, monthTrend } from "@/lib/budget";
import type { Category, Purchase } from "@/lib/types";

const grid = "rgba(100, 116, 139, 0.16)";
const axis = "rgba(71, 85, 105, 0.72)";

export function SpendingByCategoryChart({ categories, purchases }: { categories: Category[]; purchases: Purchase[] }) {
  const data = categories.map((category) => {
    const progress = categoryProgress(category, purchases);
    return { name: category.name, spent: Math.round(progress.spent), color: category.color };
  });
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="name" stroke={axis} tickLine={false} axisLine={false} />
        <YAxis stroke={axis} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 12px 40px rgba(32,46,61,.12)" }} />
        <Bar dataKey="spent" radius={[12, 12, 4, 4]}>
          {data.map((item) => (
            <Cell key={item.name} fill={item.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RemainingByCategoryChart({ categories, purchases }: { categories: Category[]; purchases: Purchase[] }) {
  const data = categories.map((category) => {
    const progress = categoryProgress(category, purchases);
    return { name: category.name, remaining: Math.round(Math.max(progress.remaining, 0)), color: category.color };
  });
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="name" stroke={axis} tickLine={false} axisLine={false} />
        <YAxis stroke={axis} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 12px 40px rgba(32,46,61,.12)" }} />
        <Bar dataKey="remaining" fill="#58c6a8" radius={[12, 12, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthTrendChart({ purchases }: { purchases: Purchase[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={monthTrend(purchases)}>
        <defs>
          <linearGradient id="spendTrend" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#58c6a8" stopOpacity={0.72} />
            <stop offset="100%" stopColor="#58c6a8" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="day" stroke={axis} tickLine={false} axisLine={false} />
        <YAxis stroke={axis} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 12px 40px rgba(32,46,61,.12)" }} />
        <Area dataKey="spent" type="monotone" stroke="#327d6d" strokeWidth={3} fill="url(#spendTrend)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
