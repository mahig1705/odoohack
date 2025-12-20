import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { appointmentTypeApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, DollarSign, ArrowRight, Sparkles } from "lucide-react";

interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  appointment_mode: string;
  is_published: boolean;
}

const CustomerDiscover = () => {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      try {
        const data = await appointmentTypeApi.list();
        setAppointmentTypes(data);
      } catch (error) {
        console.error("Error fetching appointment types:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentTypes();
  }, []);

  const filteredTypes = appointmentTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Find your perfect service</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Discover Services
            </h1>
            <p className="text-muted-foreground mt-2">Browse and book appointments that fit your needs</p>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-border rounded-xl bg-card"
            />
          </div>
        </motion.div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-border rounded-2xl animate-pulse">
                <CardContent className="p-6">
                  <div className="h-2 bg-secondary rounded-full mb-4 w-full" />
                  <div className="h-6 bg-secondary rounded mb-3 w-3/4" />
                  <div className="h-4 bg-secondary rounded w-full mb-2" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTypes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No services found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "No services are available right now"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border border-border rounded-2xl hover:shadow-lg transition-all duration-300 group h-full overflow-hidden">
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Color indicator */}
                    <div className="w-full h-2 bg-primary" />
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors mb-2">
                          {type.name}
                        </h3>
                        
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {type.appointment_mode === "ONLINE" ? "Online appointment" : "In-person appointment"}
                        </p>

                        <div className="flex items-center gap-4 text-sm mb-6">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{type.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>

                      <Link to={`/customer/book/${type.id}`} className="block">
                        <Button className="w-full rounded-xl group/btn">
                          Book Now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerDiscover;
