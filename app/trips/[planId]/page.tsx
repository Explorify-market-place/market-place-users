"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  Shield,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Info,
  Backpack,
  Ban,
  AlertTriangle,
  Navigation,
  Globe,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { DynamoDBPlan, DynamoDBDeparture } from "@/lib/dynamodb";
import { getPublicUrl } from "@/lib/s3";

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
  const departuresByDate = departures.reduce(
    (acc, dep) => {
      const dateKey = dep.departureDate.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(dep);
      return acc;
    },
    {} as Record<string, DepartureWithAvailability[]>,
  );

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
      day,
    ).padStart(2, "0")}`;
    return departuresByDate[dateStr] && departuresByDate[dateStr].length > 0;
  };

  const getDepartureCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    return departuresByDate[dateStr]?.length || 0;
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />

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
          {/* Hero Image Gallery */}
          <div className="relative h-96 rounded-3xl overflow-hidden mb-8 bg-background/40 backdrop-blur-lg border border-border/30">
            <Image
              src={
                plan.images?.[0]
                  ? getPublicUrl(plan.images[0])
                  : "/placeholder-trip.jpg"
              }
              alt={plan.name}
              fill
              className="object-cover"
              priority
            />
            {plan.images && plan.images.length > 1 && (
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm">
                1 / {plan.images.length} photos
              </div>
            )}
            <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">
                {plan.duration.value} {plan.duration.unit}
              </span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Route */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {plan.name}
                </h1>
                {(plan.startingPoint || plan.endingPoint) && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">
                      {plan.startingPoint && plan.endingPoint
                        ? `${plan.startingPoint} → ${plan.endingPoint}`
                        : plan.startingPoint || plan.endingPoint}
                    </span>
                  </div>
                )}
                {(plan.categories?.length > 0 ||
                  plan.interests?.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {plan.categories?.slice(0, 3).map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      >
                        {cat}
                      </Badge>
                    ))}
                    {plan.interests?.slice(0, 2).map((int) => (
                      <Badge
                        key={int}
                        variant="secondary"
                        className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      >
                        {int}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights */}
              {plan.highlights && plan.highlights.length > 0 && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4">Highlights</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {plan.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">About This Trip</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {plan.fullDescription || plan.description}
                </p>
              </div>

              {/* Itinerary/Stops */}
              {plan.stops && plan.stops.length > 0 && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Navigation className="w-6 h-6" />
                    Itinerary
                  </h2>
                  <div className="space-y-4">
                    {plan.stops
                      .sort((a, b) => a.order - b.order)
                      .map((stop, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                              {stop.order}
                            </div>
                            {idx < plan.stops.length - 1 && (
                              <div className="w-0.5 h-full bg-border my-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <h3 className="font-bold text-lg mb-1">
                              {stop.name}
                            </h3>
                            {stop.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {stop.description}
                              </p>
                            )}
                            {stop.activities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {stop.activities.map((activity, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {activity}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {stop.duration && stop.duration > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Clock className="w-3 h-3" />
                                {stop.duration} minutes
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* What's Included & Excluded */}
              {((plan.included && plan.included.length > 0) ||
                (plan.excluded && plan.excluded.length > 0)) && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4">What&apos;s Included</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {plan.included && plan.included.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          Included
                        </h3>
                        <ul className="space-y-2">
                          {plan.included.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-green-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.excluded && plan.excluded.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                          <X className="w-5 h-5" />
                          Not Included
                        </h3>
                        <ul className="space-y-2">
                          {plan.excluded.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-red-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Practical Information */}
              {(plan.whatToBring ||
                plan.notAllowed ||
                plan.notSuitableFor ||
                plan.knowBeforeYouGo) && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    Important Information
                  </h2>
                  <div className="space-y-4">
                    {plan.whatToBring && plan.whatToBring.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Backpack className="w-4 h-4" />
                          What to Bring
                        </h3>
                        <ul className="space-y-1 ml-6">
                          {plan.whatToBring.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground list-disc"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.notAllowed && plan.notAllowed.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                          <Ban className="w-4 h-4" />
                          Not Allowed
                        </h3>
                        <ul className="space-y-1 ml-6">
                          {plan.notAllowed.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground list-disc"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.notSuitableFor && plan.notSuitableFor.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="w-4 h-4" />
                          Not Suitable For
                        </h3>
                        <ul className="space-y-1 ml-6">
                          {plan.notSuitableFor.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground list-disc"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.knowBeforeYouGo &&
                      plan.knowBeforeYouGo.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Info className="w-4 h-4" />
                            Know Before You Go
                          </h3>
                          <ul className="space-y-1 ml-6">
                            {plan.knowBeforeYouGo.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground list-disc"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Languages & Accessibility */}
              {(plan.languages || plan.accessibility) && (
                <div className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    Accessibility & Languages
                  </h2>
                  <div className="space-y-4">
                    {plan.languages && plan.languages.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Available Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {plan.languages.map((lang) => (
                            <Badge key={lang} variant="secondary">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {plan.accessibility && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Accessibility
                        </h3>
                        <div className="space-y-2">
                          {plan.accessibility.wheelchairAccessible && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              Wheelchair accessible
                            </div>
                          )}
                          {plan.accessibility.infantSeatAvailable && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <Baby className="w-4 h-4" />
                              Infant seats available
                            </div>
                          )}
                          {plan.accessibility.strollerAccessible && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              Stroller accessible
                            </div>
                          )}
                        </div>
                      </div>
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
                <div className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                        ),
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
                          "0",
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
                                    `/trips/${planId}/book?departureId=${departure.departureId}`,
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
