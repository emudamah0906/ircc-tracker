"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";

type TrendRow = {
  fetched_at: string;
  visa_label: string;
  processing_weeks: number;
};

type ChartPoint = {
  date: string;
  [visaLabel: string]: number | string;
};

export default function TrendChart({
  countryCode,
  visaType,
}: {
  countryCode: string;
  visaType: string;
}) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [visaLabels, setVisaLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrend() {
      setLoading(true);

      let query = supabase
        .from("processing_times")
        .select("fetched_at, visa_label, processing_weeks")
        .eq("country_code", countryCode)
        .order("fetched_at", { ascending: true })
        .limit(500);

      if (visaType !== "all") {
        query = query.eq("visa_type", visaType);
      }

      const { data, error } = await query;
      if (error || !data) {
        setLoading(false);
        return;
      }

      // Group by date → visa_label → weeks
      const grouped: Record<string, Record<string, number>> = {};
      const labels = new Set<string>();

      data.forEach((row: TrendRow) => {
        const date = row.fetched_at.slice(0, 10);
        if (!grouped[date]) grouped[date] = {};
        grouped[date][row.visa_label] = row.processing_weeks;
        labels.add(row.visa_label);
      });

      const points: ChartPoint[] = Object.entries(grouped).map(
        ([date, vals]) => ({ date, ...vals })
      );

      setVisaLabels([...labels]);
      setChartData(points);
      setLoading(false);
    }

    fetchTrend();
  }, [countryCode, visaType]);

  const COLORS = [
    "#f97316", "#3b82f6", "#22c55e", "#a855f7",
    "#ec4899", "#eab308", "#14b8a6",
  ];

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        Loading trend data...
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No historical data yet — check back after the first few daily runs.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          label={{ value: "weeks", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {visaLabels.map((label, i) => (
          <Line
            key={label}
            type="monotone"
            dataKey={label}
            stroke={COLORS[i % COLORS.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
