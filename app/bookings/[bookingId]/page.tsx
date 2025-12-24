import { auth } from "@/auth";
import {
  getBookingById,
  getPlanById,
  getDepartureById,
} from "@/lib/db-helpers";
import { redirect, notFound } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  ArrowLeft,
  Clock,
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
  const departure = booking.departureId
    ? await getDepartureById(booking.departureId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Status Card */}
          <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-3xl p-8 md:p-12 text-center mb-8">
            {/* Status Icon */}
            <div
              className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-scale-in ${
                booking.bookingStatus === "cancelled"
                  ? "bg-gradient-to-br from-red-500 to-rose-600"
                  : "bg-gradient-to-br from-green-500 to-emerald-600"
              }`}
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {booking.bookingStatus === "cancelled"
                  ? "Booking Cancelled"
                  : "Booking Confirmed!"}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              {booking.bookingStatus === "cancelled"
                ? booking.refundStatus === "completed"
                  ? `Refund processed: ₹${booking.refundAmount?.toLocaleString()}`
                  : booking.refundStatus === "processing"
                  ? "Refund in progress"
                  : "Payment will be refunded"
                : "Your payment was successful"}
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

                {/* Departure Details Section */}
                {departure && (
                  <div className="pt-4 border-t border-border/30">
                    <h3 className="font-semibold mb-3">
                      Departure Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Pickup Time
                          </div>
                          <div className="font-semibold">
                            {departure.pickupTime}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Pickup Location
                          </div>
                          <div className="font-semibold">
                            {departure.pickupLocation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Travel Date
                      </div>
                      <div className="font-semibold">
                        {new Date(booking.tripDate).toLocaleDateString(
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

                <div className="pt-4 border-t border-border/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Trip Cost ({booking.numPeople} × ₹
                      {Math.round(
                        (booking.tripCost || 0) / booking.numPeople
                      ).toLocaleString()}
                      )
                    </span>
                    <span className="font-semibold">
                      ₹{(booking.tripCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Platform Fee (2%)
                    </span>
                    <span className="font-semibold">
                      ₹{(booking.platformFee || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border/30">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Total Amount Paid</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{booking.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cancellation & Refund Details */}
          {booking.bookingStatus === "cancelled" && (
            <div className="bg-background/40 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6 md:p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-red-600 dark:text-red-400">
                Cancellation & Refund Details
              </h2>

              <div className="space-y-4">
                {booking.cancelledAt && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Cancelled On</span>
                    <span className="font-semibold text-right">
                      {new Date(booking.cancelledAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {booking.cancellationReason && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="font-semibold text-right max-w-md">
                      {booking.cancellationReason}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-border/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">
                      Refund Percentage
                    </span>
                    <span className="font-semibold text-lg">
                      {booking.refundPercentage || 0}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Refund Amount</span>
                    <span className="font-bold text-xl text-green-600 dark:text-green-400">
                      ₹{(booking.refundAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Refund Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        booking.refundStatus === "completed"
                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : booking.refundStatus === "processing"
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : booking.refundStatus === "rejected"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {booking.refundStatus === "completed"
                        ? "Completed"
                        : booking.refundStatus === "processing"
                        ? "Processing"
                        : booking.refundStatus === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </span>
                  </div>

                  {booking.refundDate && (
                    <div className="flex justify-between items-start mt-2">
                      <span className="text-muted-foreground">Refunded On</span>
                      <span className="font-semibold text-right">
                        {new Date(booking.refundDate).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {booking.refundStatus === "processing" && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      💡 Your refund is being processed. It typically takes 5-7
                      business days to reflect in your account.
                    </p>
                  </div>
                )}

                {booking.refundStatus === "rejected" && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ Refund failed due to insufficient balance in test mode.
                      Contact support for assistance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            {/* Cancel Button (shows only if eligible) */}
            <CancelBookingButton
              bookingId={booking.bookingId}
              tripDate={booking.tripDate}
              bookingStatus={booking.bookingStatus}
              tripCost={booking.tripCost || booking.totalAmount}
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
