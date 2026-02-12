"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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

type Query = {
  id: string;
  email: string;
  subject: string;
  message: string;
  createdat: string;
  iscleared: boolean;
};

export default function AdminAnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<{ day: string; total: number }[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);

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

  async function fetchQueries() {
    setLoadingQueries(true);
    const { data, error } = await supabase
      .from("user_queries")
      .select("*")
      .order("createdat", { ascending: false })
      .limit(100);

    if (!error && data) setQueries(data as Query[]);
    setLoadingQueries(false);
  }

  async function markCleared(id: string) {
    const { error } = await supabase
      .from("user_queries")
      .update({ iscleared: true })
      .eq("id", id);

    if (!error) {
      setQueries(prev =>
        prev.map(q => (q.id === id ? { ...q, iscleared: true } : q))
      );

      // refresh stats so open_queries card stays accurate
      fetchStats();
    }
  }

  useEffect(() => {
    async function fetchData() {
      await fetchStats();
      await fetchTrend();
      await fetchQueries();
    }
    fetchData();
  }, []);

  if (!stats) {
    return (
      <div className="p-10 text-white bg-zinc-950 min-h-screen">
        Loading analytics…
      </div>
    );
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

      {/* Queries Section */}
      <Card className="rounded-2xl shadow-md bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">User Queries</h2>
            <button
              onClick={fetchQueries}
              className="px-3 py-1 text-sm rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              Refresh
            </button>
          </div>

          {loadingQueries && (
            <p className="text-sm text-zinc-400">Loading queries…</p>
          )}

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
            {queries.length === 0 && !loadingQueries && (
              <p className="text-sm text-zinc-400">No queries found.</p>
            )}

            {queries.map(q => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-zinc-800 border border-zinc-700"
              >
                <div className="flex justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-zinc-400">{q.email}</p>
                      <p className="font-semibold text-white">{q.subject}</p>
                    </div>

                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {q.message}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {new Date(q.createdat).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-start">
                    {!q.iscleared ? (
                      <button
                        onClick={() => markCleared(q.id)}
                        className="px-3 py-1 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white"
                      >
                        Mark Cleared
                      </button>
                    ) : (
                      <span className="text-green-400 text-sm font-semibold">
                        Cleared
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
