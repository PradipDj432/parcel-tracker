"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CourierBreakdown {
  courier: string;
  total: number;
  delivered: number;
  successRate: number;
}

interface CourierChartProps {
  data: CourierBreakdown[];
}

export function CourierChart({ data }: CourierChartProps) {
  if (!data.length) return null;

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-4 text-sm font-semibold">Courier Breakdown</h3>

      {/* Chart */}
      {data.length > 0 && (
        <div className="mb-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="courier"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="total"
                fill="#a1a1aa"
                name="Total"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="delivered"
                fill="#4ade80"
                name="Delivered"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="pb-2 font-medium">Courier</th>
              <th className="pb-2 text-right font-medium">Total</th>
              <th className="pb-2 text-right font-medium">Delivered</th>
              <th className="pb-2 text-right font-medium">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.courier}
                className="border-b border-zinc-100 dark:border-zinc-800/50"
              >
                <td className="py-2 font-mono text-xs">{row.courier}</td>
                <td className="py-2 text-right">{row.total}</td>
                <td className="py-2 text-right">{row.delivered}</td>
                <td className="py-2 text-right">
                  <span
                    className={
                      row.successRate >= 80
                        ? "text-green-600 dark:text-green-400"
                        : row.successRate >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-500"
                    }
                  >
                    {row.successRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
