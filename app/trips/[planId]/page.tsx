"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Shield,
  Star,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { DynamoDBPlan, DynamoDBDeparture } from "@/lib/dynamodb";

interface DepartureWithAvailability extends DynamoDBDeparture {
  availableSeats: number;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<DynamoDBPlan | null>(null);
  const [departures, setDepartures] = useState<DepartureWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plan details
        const planRes = await fetch(`/api/plans/${planId}`);
        if (planRes.ok) {
          const planData = await planRes.json();
          setPlan(planData.plan);
        }

        // Fetch departures
        const deptRes = await fetch(`/api/departures?planId=${planId}`);
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartures(deptData.departures);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Trip not found
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group departures by date
  const departuresByDate = departures.reduce((acc, dep) => {
    const dateKey = dep.departureDate.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(dep);
    return acc;
  }, {} as Record<string, DepartureWithAvailability[]>);

  // Get selected date departures
  const selectedDateDepartures = selectedDate
    ? departuresByDate[selectedDate] || []
    : [];

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const hasDeparture = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return departuresByDate[dateStr] && departuresByDate[dateStr].length > 0;
  };

  const getDepartureCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return departuresByDate[dateStr]?.length || 0;
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    if (hasDeparture(day)) {
      setSelectedDate(dateStr);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
    setSelectedDate(null);
  };

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

            {/* Right Column - Departures & Booking */}
            <div className="lg:col-span-1 space-y-6">
              {/* Price Card */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Price per person
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{plan.price.toLocaleString()}
                </div>
              </div>

              {/* Departures List */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">
                  Select Departure Date
                </h3>

                {departures.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No departures scheduled yet</p>
                    <p className="text-sm mt-1">Check back later for updates</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousMonth}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="font-semibold">
                        {currentMonth.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Day headers */}
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center text-xs font-medium text-muted-foreground py-2"
                          >
                            {day}
                          </div>
                        )
                      )}

                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}

                      {/* Calendar days */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const hasDep = hasDeparture(day);
                        const count = getDepartureCount(day);
                        const dateStr = `${year}-${String(month + 1).padStart(
                          2,
                          "0"
                        )}-${String(day).padStart(2, "0")}`;
                        const isSelected = selectedDate === dateStr;
                        const isPast =
                          new Date(dateStr) <
                          new Date(new Date().setHours(0, 0, 0, 0));

                        return (
                          <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            disabled={!hasDep || isPast}
                            className={`
                              aspect-square rounded-lg p-2 text-sm transition-all relative
                              ${
                                hasDep && !isPast
                                  ? "cursor-pointer hover:bg-primary/10 hover:scale-105"
                                  : "cursor-not-allowed opacity-30"
                              }
                              ${
                                isSelected
                                  ? "bg-primary text-primary-foreground font-bold"
                                  : hasDep && !isPast
                                  ? "bg-green-500/20 text-green-600 dark:text-green-400 font-semibold"
                                  : ""
                              }
                            `}
                          >
                            <div>{day}</div>
                            {hasDep && count > 1 && !isPast && (
                              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-current rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Date Departures */}
                    {selectedDate && selectedDateDepartures.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border/30 space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground">
                          Departures on {formatDate(selectedDate)}
                        </h4>
                        {selectedDateDepartures.map((departure) => {
                          const occupancyPercent =
                            (departure.bookedSeats / departure.totalCapacity) *
                            100;
                          const isFull = departure.availableSeats === 0;
                          const isFillingFast =
                            departure.availableSeats < 5 && !isFull;

                          return (
                            <div
                              key={departure.departureId}
                              className="border border-border/50 rounded-xl p-4 hover:border-border transition-all"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {departure.pickupTime}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {departure.pickupLocation}
                                  </div>
                                </div>
                                {isFull ? (
                                  <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-600 dark:text-red-400 rounded-full">
                                    Sold Out
                                  </span>
                                ) : isFillingFast ? (
                                  <span className="px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                                    Filling Fast
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/20 text-green-600 dark:text-green-400 rounded-full">
                                    Available
                                  </span>
                                )}
                              </div>

                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">
                                    Seats
                                  </span>
                                  <span className="font-medium">
                                    {departure.availableSeats} /{" "}
                                    {departure.totalCapacity}
                                  </span>
                                </div>
                                <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      occupancyPercent >= 90
                                        ? "bg-red-500"
                                        : occupancyPercent >= 70
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                    style={{ width: `${occupancyPercent}%` }}
                                  />
                                </div>
                              </div>

                              <Button
                                onClick={() =>
                                  router.push(
                                    `/trips/${planId}/book?departureId=${departure.departureId}`
                                  )
                                }
                                disabled={isFull}
                                size="sm"
                                className="w-full"
                              >
                                {isFull
                                  ? "Fully Booked"
                                  : "Book This Departure"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedDate && selectedDateDepartures.length === 0 && (
                      <div className="mt-6 pt-6 border-t border-border/30 text-center text-sm text-muted-foreground">
                        No departures available for this date
                      </div>
                    )}
                  </div>
                )}

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
