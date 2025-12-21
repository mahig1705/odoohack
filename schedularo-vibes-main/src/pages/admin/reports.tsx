import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const AdminReports = () => {
  const [summary, setSummary] = useState<any>(null);
  const [byAppointment, setByAppointment] = useState<any[]>([]);
  const [byProvider, setByProvider] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
        adminApi.getSummary(),
        adminApi.revenueByAppointment(),
        adminApi.revenueByProvider(),
        adminApi.recentTransactions(),
    ]).then(([s, a, p, t]) => {
      setSummary(s);
      setByAppointment(a);
      setByProvider(p);
      setTransactions(t);
    });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Revenue, performance and transaction insights
          </p>
        </div>

        {/* KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Total Revenue" value={`₹${summary.total_revenue}`} />
            <Stat label="Transactions" value={summary.total_transactions} />
            <Stat label="Successful" value={summary.successful} />
            <Stat label="Failed" value={summary.failed} />
          </div>
        )}

        {/* Revenue by Appointment */}
        <ChartCard title="Revenue by Appointment Type">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byAppointment}>
              <XAxis dataKey="appointment" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by Provider */}
        <ChartCard title="Revenue by Service Provider">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byProvider}>
              <XAxis dataKey="provider" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Transactions Trend */}
        <ChartCard title="Recent Transaction Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" hide />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Transactions Table */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Recent Transactions
            </h2>

            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">User</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td>{t.user}</td>
                    <td>{t.service}</td>
                    <td>₹{t.amount}</td>
                    <td>
                      <Badge
                        variant={
                          t.status === "SUCCESS" ? "default" : "destructive"
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;

/* ---------------- Components ---------------- */

const Stat = ({ label, value }: any) => (
  <Card className="rounded-2xl">
    <CardContent className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }: any) => (
  <Card className="rounded-2xl">
    <CardContent className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </CardContent>
  </Card>
);
