import { getPlanById } from "@/lib/db-helpers";
import { notFound } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Shield,
  Star,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const plan = await getPlanById(planId);

  if (!plan) {
    notFound();
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
          <Link href="/trips" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Link>
        </Button>

        <div className="max-w-5xl mx-auto">
          {/* Hero Image */}
          <div className="relative h-96 rounded-3xl overflow-hidden mb-8 bg-background/40 backdrop-blur-lg border border-border/30">
            <Image
              src={plan.image || "/placeholder-trip.jpg"}
              alt={plan.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold">4.8 / 5</span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {plan.name}
                </h1>
                {plan.route && plan.route.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{plan.route.join(" → ")}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">About This Trip</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">What's Included</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: Shield, text: "Travel Insurance" },
                    { icon: Users, text: "Professional Guide" },
                    { icon: Calendar, text: "Flexible Dates" },
                    { icon: Clock, text: "24/7 Support" },
                  ].map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refund Policy */}
              {(plan.refundPercentage || plan.refundDaysBeforeTrip) && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    Cancellation Policy
                  </h2>
                  <div className="space-y-2 text-muted-foreground">
                    {plan.refundPercentage && (
                      <p>• {plan.refundPercentage}% refund available</p>
                    )}
                    {plan.refundDaysBeforeTrip && (
                      <p>
                        • Cancel up to {plan.refundDaysBeforeTrip} days before
                        trip starts
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6 sticky top-6">
                <div className="mb-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    Price per person
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ₹{plan.price.toLocaleString()}
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg py-6"
                >
                  <Link href={`/trips/${plan.planId}/book`}>
                    Book This Trip
                  </Link>
                </Button>

                <div className="mt-6 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment with Razorpay</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Instant booking confirmation</span>
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
