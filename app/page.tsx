"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="rounded-2xl shadow-md bg-zinc-900">
      <CardContent className="p-6">
        <p className="text-sm opacity-60 text-zinc-300">{title}</p>
        <p className="text-3xl font-bold mt-2 text-white">{value ?? 0}</p>
      </CardContent>
    </Card>
  );
}

type TrendChartProps = {
  data: { day: string; total: number }[];
};

function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="day" stroke="#d4d4d8" />
          <YAxis stroke="#d4d4d8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              color: "#fff",
            }}
            wrapperStyle={{
              backgroundColor: "#18181b",
              color: "#fff",
            }}
          />
          <Line type="monotone" dataKey="total" stroke="#6366f1" dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type Stats = {
  total_mentees: number;
  mentees_registered: number;
  total_mentors: number;
  mentors_selected: number;
  total_projects: number;
  total_prs: number;
  referrals_approved: number;
  open_queries: number;
};

export default function AdminAnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<{ day: string; total: number }[]>([]);

  async function fetchStats() {
    const { data } = await supabase
      .from("dashboard_quick_stats")
      .select("*")
      .single();

    setStats(data as Stats);
  }

  async function fetchTrend() {
    const { data } = await supabase
      .from("mentee_daily")
      .select("*")
      .order("day", { ascending: true });

    setTrend((data as { day: string; total: number }[]) || []);
  }

  useEffect(() => {
    async function fetchData() {
      await fetchStats();
      await fetchTrend();
    }
    fetchData();
  }, []);

  if (!stats) {
    return <div className="p-10 text-white bg-zinc-950 min-h-screen">Loading analytics…</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-zinc-950 min-h-screen">
      <h1 className="text-3xl font-bold text-white">Admin Analytics</h1>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Mentees" value={stats.total_mentees} />
        <StatCard title="Registered Mentees" value={stats.mentees_registered} />
        <StatCard title="Total Mentors" value={stats.total_mentors} />
        <StatCard title="Selected Mentors" value={stats.mentors_selected} />
        <StatCard title="Projects" value={stats.total_projects} />
        <StatCard title="Total PRs" value={stats.total_prs} />
        <StatCard title="Approved Referrals" value={stats.referrals_approved} />
        <StatCard title="Open Queries" value={stats.open_queries} />
      </div>

      {/* Trend Section */}
      <Card className="rounded-2xl shadow-md bg-zinc-900">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Daily Mentee Registration Trend
          </h2>
          <TrendChart data={trend} />
        </CardContent>
      </Card>
    </div>
  );
}
