import { auth } from "@/auth";
import { getBookingById, getPlanById } from "@/lib/db-helpers";
import { redirect, notFound } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CancelBookingButton } from "@/components/bookings/CancelBookingButton";

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { bookingId } = await params;
  const { success } = await searchParams;

  const booking = await getBookingById(bookingId);

  if (!booking || booking.userId !== session.user.id) {
    notFound();
  }

  const plan = await getPlanById(booking.planId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Card */}
          <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-3xl p-8 md:p-12 text-center mb-8">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-scale-in">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Booking Confirmed!
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Your payment was successful
            </p>
            <p className="text-sm text-muted-foreground">
              Booking ID: <span className="font-mono">{booking.bookingId}</span>
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">Booking Details</h2>

            {plan && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border/30">
                  {plan.image && (
                    <img
                      src={plan.image}
                      alt={plan.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                    {plan.route && plan.route.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {plan.route.join(" → ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Travel Date
                      </div>
                      <div className="font-semibold">
                        {new Date(booking.dateBooked).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Number of Adults
                      </div>
                      <div className="font-semibold">{booking.numPeople}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Payment ID
                      </div>
                      <div className="font-mono text-sm">
                        {booking.razorpayPaymentId?.slice(0, 20)}...
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Payment Status
                      </div>
                      <div className="font-semibold text-green-600">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold">Total Amount Paid</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ₹{booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Cancel Button (shows only if eligible) */}
            <CancelBookingButton
              bookingId={booking.bookingId}
              tripDate={booking.dateBooked}
              bookingStatus={booking.bookingStatus}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/bookings">View All Bookings</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="flex-1 rounded-full"
              >
                <Link href="/trips">Browse More Trips</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
