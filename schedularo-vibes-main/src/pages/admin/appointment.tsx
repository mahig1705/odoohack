import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AppointmentType = {
  id: string;
  name: string;
  duration_minutes: number;
  appointment_mode: string;
  is_published: boolean;
  created_by_name: string;
};

type Booking = {
  id: string;
  appointment_type_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  booked_by: string;
  status: string;
};

const AdminAppointments = () => {
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getAppointmentTypes(),
      adminApi.getBookings(),
    ])
      .then(([t, b]) => {
        setTypes(t);
        setBookings(b);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Services configuration and booking oversight
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading data…</p>
        ) : (
          <>
            {/* ================= APPOINTMENT TYPES ================= */}
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Appointment Types
                  </h2>
                  <Badge variant="secondary">
                    {types.length} total
                  </Badge>
                </div>

                <Separator />

                {types.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No appointment types created yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="py-2 text-left">Name</th>
                          <th className="text-left">Duration</th>
                          <th className="text-left">Mode</th>
                          <th className="text-left">Organizer</th>
                          <th className="text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {types.map((t) => (
                          <tr key={t.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{t.name}</td>
                            <td>{t.duration_minutes} mins</td>
                            <td className="capitalize">{t.appointment_mode}</td>
                            <td>{t.created_by_name}</td>
                            <td className="text-right">
                              <Badge variant={t.is_published ? "default" : "secondary"}>
                                {t.is_published ? "Published" : "Draft"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ================= BOOKINGS ================= */}
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    All Bookings
                  </h2>
                  <Badge variant="secondary">
                    {bookings.length} total
                  </Badge>
                </div>

                <Separator />

                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bookings have been made yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b">
                          <th className="py-2 text-left">Service</th>
                          <th className="text-left">Date</th>
                          <th className="text-left">Time</th>
                          <th className="text-left">Customer</th>
                          <th className="text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">
                              {b.appointment_type_name}
                            </td>
                            <td>{b.slot_date}</td>
                            <td>
                              {b.start_time} – {b.end_time}
                            </td>
                            <td>{b.booked_by}</td>
                            <td className="text-right">
                              <Badge>{b.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAppointments;
