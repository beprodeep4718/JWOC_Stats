// app/dashboard/page.tsx
import TrendChart from "@/components/TrendChart";
import { supabase } from "@/lib/supabase";


async function getStats() {
  const { data } = await supabase
    .from("dashboard_quick_stats")
    .select("*")
    .single();

  return data;
}

async function getTrend() {
  const { data } = await supabase
    .from("mentee_daily")
    .select("*")
    .order("day", { ascending: true });

  return data ?? [];
}

export default async function Dashboard() {
  const stats = await getStats();
  const trend = await getTrend();

  return (
    <div className="p-8 space-y-8">

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Stat title="Mentees" value={stats.total_mentees} />
        <Stat title="Registered" value={stats.mentees_registered} />
        <Stat title="Mentors" value={stats.total_mentors} />
        <Stat title="Projects" value={stats.total_projects} />
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border p-6">
        <h2 className="text-xl font-bold mb-4">
          Daily Mentee Registrations
        </h2>
        <TrendChart data={trend} />
      </div>

    </div>
  );
}

function Stat({ title, value }: any) {
  return (
    <div className="rounded-xl border p-6 shadow-sm">
      <p className="text-sm opacity-60">{title}</p>
      <p className="text-3xl font-bold">{value ?? 0}</p>
    </div>
  );
}
