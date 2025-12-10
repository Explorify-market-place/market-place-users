import { getAllActivePlans } from "@/lib/db-helpers";
import Link from "next/link";
import { MapPin, Calendar, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TripsPage() {
  const plans = await getAllActivePlans();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Explore Amazing
            </span>
            <br />
            <span className="text-foreground">Destinations</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover handpicked travel experiences curated just for you
          </p>
        </div>

        {/* Trips Grid */}
        {plans.length === 0 ? (
          <div className="max-w-md mx-auto bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">No trips available yet</h2>
            <p className="text-muted-foreground">
              Check back soon for amazing travel experiences!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.planId}
                className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
              >
                {/* Trip Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={plan.image || "/placeholder-trip.jpg"}
                    alt={plan.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 line-clamp-1">
                    {plan.name}
                  </h3>

                  {/* Route */}
                  {plan.route && plan.route.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {plan.route.join(" → ")}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Starting from
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{plan.price.toLocaleString()}
                      </div>
                    </div>
                    <Button
                      asChild
                      className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Link href={`/trips/${plan.planId}`}>Book Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
