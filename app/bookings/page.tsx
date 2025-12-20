import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Package } from "lucide-react";
import { getBookingsByUser, getPlanById } from "@/lib/db-helpers";

export default async function BookingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/bookings");
  }

  // Fetch user's bookings from DynamoDB
  const bookings = await getBookingsByUser(session.user.id);

  // Fetch plan details for each booking
  const bookingsWithPlans = await Promise.all(
    bookings.map(async (booking) => {
      const plan = await getPlanById(booking.planId);
      return {
        ...booking,
        tripTitle: plan?.name || "Unknown Trip",
        location: plan?.route?.join(" → ") || "Unknown",
        tripImage: plan?.image || "/placeholder-trip.jpg",
      };
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Bookings
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            View and manage all your trip bookings
          </p>
        </div>

        {/* Bookings Content */}
        <div className="max-w-4xl mx-auto">
          {bookingsWithPlans.length === 0 ? (
            // Empty State
            <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No bookings yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start exploring amazing destinations and book your first trip
                today!
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/trips">Browse Trips</Link>
              </Button>
            </div>
          ) : (
            // Bookings List
            <div className="space-y-4">
              {bookingsWithPlans.map((booking) => (
                <Link
                  key={booking.bookingId}
                  href={`/bookings/${booking.bookingId}`}
                  className="block bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <img
                        src={booking.tripImage}
                        alt={booking.tripTitle}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">
                          {booking.tripTitle}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Travel Date:{" "}
                              {new Date(
                                booking.tripDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Booked:{" "}
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        ₹{booking.totalAmount.toLocaleString()}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {/* Booking Status Badge */}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            (booking.bookingStatus || "confirmed") ===
                            "confirmed"
                              ? "bg-green-500/10 text-green-600 border border-green-500/20"
                              : (booking.bookingStatus || "confirmed") ===
                                "cancelled"
                              ? "bg-red-500/10 text-red-600 border border-red-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          {(booking.bookingStatus || "confirmed")
                            .charAt(0)
                            .toUpperCase() +
                            (booking.bookingStatus || "confirmed").slice(1)}
                        </span>
                        {/* Refund Badge if applicable */}
                        {booking.refundStatus === "completed" && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            Refunded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
