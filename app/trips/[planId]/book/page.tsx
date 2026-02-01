"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Shield,
  Loader2,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { DynamoDBPlan, DynamoDBDeparture } from "@/lib/dynamodb";

interface BookingPageProps {
  params: Promise<{ planId: string }>; // params is a Promise
}

interface DepartureWithAvailability extends DynamoDBDeparture {
  availableSeats: number;
}

export default function BookingPage({ params }: BookingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const departureId = searchParams.get("departureId");

  const [planId, setPlanId] = useState<string>("");
  const [plan, setPlan] = useState<DynamoDBPlan | null>(null);
  const [departure, setDeparture] = useState<DepartureWithAvailability | null>(
    null
  );
  const [numAdults, setNumAdults] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ planId: id }) => {
      setPlanId(id);
      fetchData(id);
    });
  }, [params, departureId]);

  const fetchData = async (id: string) => {
    try {
      // Fetch plan
      const planResponse = await fetch(`/api/plans/${id}`);
      if (!planResponse.ok) throw new Error("Failed to fetch plan");
      const planData = await planResponse.json();
      setPlan(planData.plan);

      // Fetch departure if departureId is provided
      if (departureId) {
        const deptResponse = await fetch(`/api/departures?planId=${id}`);
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          const selectedDeparture = deptData.departures.find(
            (d: DepartureWithAvailability) => d.departureId === departureId
          );

          if (selectedDeparture) {
            setDeparture(selectedDeparture);
          } else {
            setError("Selected departure not found");
          }
        }
      } else {
        setError(
          "No departure selected. Please select a departure from the trip details page."
        );
      }
    } catch (err) {
      setError("Failed to load trip details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate costs - user pays trip cost only, no extra fees
  const tripCost = plan ? plan.price * numAdults : 0;
  const totalAmount = tripCost; // No extra platform fee

  const maxAdults = departure ? Math.min(10, departure.availableSeats) : 10;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if already loaded
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!departure) {
      setError("No departure selected");
      return;
    }

    if (numAdults > departure.availableSeats) {
      setError(`Only ${departure.availableSeats} seats available`);
      return;
    }

    setIsProcessing(true);
    setError("");

    let createdBookingId: string | null = null;

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // STEP 1: Create booking (pending state, seats reserved)
      const bookingResponse = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          departureId: departure.departureId,
          numPeople: numAdults,
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const bookingData = await bookingResponse.json();
      createdBookingId = bookingData.bookingId;

      console.log("Booking created:", { bookingId: createdBookingId });

      // STEP 2: Create Razorpay order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: createdBookingId,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();
      console.log("Payment order created:", orderData.orderId);

      // STEP 3: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ExplorifyTrips",
        description: plan?.name || "Trip Booking",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            console.log("Razorpay payment success:", response);

            // STEP 4: Verify payment (updates booking to confirmed)
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: createdBookingId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            console.log("Verify response status:", verifyResponse.status);

            if (!verifyResponse.ok) {
              let errorData;
              try {
                errorData = await verifyResponse.json();
              } catch (e) {
                console.error("Failed to parse error response:", e);
                errorData = { error: `Server error: ${verifyResponse.status}` };
              }
              console.error("Verification error:", errorData);
              
              // Redirect to booking page even if verification fails
              // Webhook will eventually confirm it
              router.push(`/bookings/${createdBookingId}?processing=true`);
              return;
            }

            // Verification successful - redirect to success page
            router.push(`/bookings/${createdBookingId}?success=true`);
          } catch (err) {
            console.error("Payment verification error:", err);
            // Redirect to booking page, webhook will handle confirmation
            router.push(`/bookings/${createdBookingId}?processing=true`);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: async function () {
            console.log("User dismissed payment modal");
            setIsProcessing(false);
            
            // Cancel the pending booking and release seats
            if (createdBookingId) {
              try {
                await fetch(`/api/bookings/${createdBookingId}/cancel`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    reason: "Payment cancelled by user",
                  }),
                });
                console.log("Booking cancelled, seats released");
              } catch (error) {
                console.error("Failed to cancel booking:", error);
              }
            }
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate payment. Please try again.");
      setIsProcessing(false);
      
      // If booking was created but payment failed, try to cancel it
      if (createdBookingId) {
        try {
          await fetch(`/api/bookings/${createdBookingId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: "Payment initiation failed",
            }),
          });
        } catch (cancelError) {
          console.error("Failed to cancel booking after error:", cancelError);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Trip not found</h2>
          <Button asChild>
            <Link href="/trips">Back to Trips</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-5">
          <Link href={`/trips/${planId}`} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Trip Details
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Complete Your Booking
            </span>
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Summary */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Trip Summary</h2>
                <div className="flex gap-4">
                  <Image
                    src={plan.images?.[0] || "/placeholder-trip.jpg"}
                    alt={plan.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.stops && plan.stops.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {plan.stops.map(s => s.name).join(" → ")}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      ₹{plan.price.toLocaleString()} per person
                    </p>
                  </div>
                </div>
              </div>

              {/* Departure Details */}
              {departure && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4">Departure Details</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Departure Date
                        </div>
                        <div className="font-semibold">
                          {new Date(departure.departureDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Pickup Time
                        </div>
                        <div className="font-semibold">
                          {departure.pickupTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Pickup Location
                        </div>
                        <div className="font-semibold">
                          {departure.pickupLocation}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Available Seats
                        </div>
                        <div className="font-semibold">
                          {departure.availableSeats} / {departure.totalCapacity}
                        </div>
                      </div>
                    </div>
                  </div>
                  {departure.availableSeats < 5 && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                          Limited Availability
                        </div>
                        <div className="text-yellow-600/80 dark:text-yellow-400/80">
                          Only {departure.availableSeats} seats remaining. Book
                          soon!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Number of Adults */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <label className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Users className="w-5 h-5" />
                  Number of Adults
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setNumAdults(Math.max(1, numAdults - 1))}
                    disabled={numAdults <= 1}
                    className="rounded-full w-12 h-12"
                  >
                    -
                  </Button>
                  <div className="text-3xl font-bold w-16 text-center">
                    {numAdults}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      setNumAdults(Math.min(maxAdults, numAdults + 1))
                    }
                    disabled={numAdults >= maxAdults}
                    className="rounded-full w-12 h-12"
                  >
                    +
                  </Button>
                  <span className="text-muted-foreground ml-2">
                    (Max {maxAdults} {maxAdults === 1 ? "person" : "people"})
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4">
                  {error}
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6 sticky top-6">
                <h2 className="text-2xl font-bold mb-6">Price Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Trip cost ({numAdults} × ₹{plan.price.toLocaleString()})
                    </span>
                    <span>₹{tripCost.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        Total Amount
                      </span>
                      <span className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !departure}
                  size="lg"
                  className="w-full rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg py-6"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <div className="mt-6 pt-6 border-t border-border/30 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment powered by Razorpay</span>
                  </div>

                  {/* Cancellation Policy */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Cancellation Policy:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 15+ days before trip: 100% refund</li>
                      <li>• 8-14 days before trip: 50% refund</li>
                      <li>• 1-7 days before trip: No refund</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
