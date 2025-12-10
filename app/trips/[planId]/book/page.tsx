"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface BookingPageProps {
  params: Promise<{ planId: string }>;
}

interface Plan {
  planId: string;
  name: string;
  price: number;
  image: string;
  route: string[];
  description: string;
}

export default function BookingPage({ params }: BookingPageProps) {
  const router = useRouter();
  const [planId, setPlanId] = useState<string>("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [numAdults, setNumAdults] = useState(1);
  const [travelDate, setTravelDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Platform fee percentage
  const PLATFORM_FEE_PERCENT = 2;

  useEffect(() => {
    params.then(({ planId: id }) => {
      setPlanId(id);
      fetchPlan(id);
    });
  }, [params]);

  const fetchPlan = async (id: string) => {
    try {
      const response = await fetch(`/api/plans/${id}`);
      if (!response.ok) throw new Error("Failed to fetch plan");
      const data = await response.json();
      setPlan(data.plan);
    } catch (err) {
      setError("Failed to load trip details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate costs
  const tripCost = plan ? plan.price * numAdults : 0;
  const platformFee = Math.round(tripCost * (PLATFORM_FEE_PERCENT / 100));
  const totalAmount = tripCost + platformFee;

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
    if (!travelDate) {
      setError("Please select a travel date");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // Create order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          numPeople: numAdults,
          dateBooked: travelDate,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();
      
      // Store order ID for later use
      const createdOrderId = orderData.orderId;

      // Razorpay checkout options
      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ExplorifyTrips",
        description: plan?.name || "Trip Booking",
        order_id: createdOrderId,
        handler: async function (response: any) {
          try {
            console.log("Razorpay response:", response);
            
            const verifyPayload = {
              orderId: createdOrderId, // Use the order ID we created
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId,
              numAdults,
              travelDate,
              totalAmount,
            };
            
            console.log("Sending verification payload:", verifyPayload);
            
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(verifyPayload),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              console.error("Verification error:", errorData);
              throw new Error(errorData.error || "Payment verification failed");
            }

            const verifyData = await verifyResponse.json();

            // Redirect to success page
            router.push(`/bookings/${verifyData.bookingId}?success=true`);
          } catch (err) {
            console.error("Payment verification error:", err);
            setError("Payment verification failed. Please contact support.");
            setIsProcessing(false);
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
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/trips/${planId}`} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Trip Details
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                  <img
                    src={plan.image}
                    alt={plan.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.route && plan.route.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {plan.route.join(" → ")}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      ₹{plan.price.toLocaleString()} per person
                    </p>
                  </div>
                </div>
              </div>

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
                    onClick={() => setNumAdults(Math.min(10, numAdults + 1))}
                    disabled={numAdults >= 10}
                    className="rounded-full w-12 h-12"
                  >
                    +
                  </Button>
                  <span className="text-muted-foreground ml-2">
                    (Max 10 adults)
                  </span>
                </div>
              </div>

              {/* Travel Date */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <label className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Calendar className="w-5 h-5" />
                  Travel Date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  required
                />
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
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                    <span>₹{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        Total Amount
                      </span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !travelDate}
                  size="lg"
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg py-6"
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

                <div className="mt-6 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment powered by Razorpay</span>
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
