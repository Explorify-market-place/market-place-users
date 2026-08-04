"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { DynamoDBPlan } from "@/types/dynamodb";
import type { TripFilter, FilterOptions } from "@/types/filter-types";
import TripCard from "./TripCard";
import TripFilterSidebar from "./TripFilterSidebar";
import TripSearchBar from "./TripSearchBar";

export default function TripsPageClient() {
  const [plans, setPlans] = useState<DynamoDBPlan[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    interests: [],
    languages: [],
    priceRange: { min: 0, max: 50000 },
    locations: [],
  });
  const [filter, setFilter] = useState<TripFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Fetch plans on mount ──
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/trips/search");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPlans(data.plans || []);
        setFilterOptions(
          data.filterOptions || {
            categories: [],
            interests: [],
            languages: [],
            priceRange: { min: 0, max: 50000 },
            locations: [],
          },
        );
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlans();
  }, []);

  // ── Client-side filter logic ──
  const filteredPlans = useMemo(() => filterPlans(plans, filter), [plans, filter]);

  const handleFilterChange = useCallback((newFilter: TripFilter) => {
    setFilter(newFilter);
  }, []);

  const handleNLFilterResult = useCallback((nlFilter: TripFilter) => {
    setFilter(nlFilter);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.priceMin != null || filter.priceMax != null) count++;
    if (filter.durationMin != null || filter.durationMax != null) count++;
    if (filter.categories?.length) count++;
    if (filter.interests?.length) count++;
    if (filter.languages?.length) count++;
    if (filter.startingPoint) count++;
    if (filter.textSearch) count++;
    return count;
  }, [filter]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[100px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-10 w-full py-12 pt-28">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-6 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-primary tracking-[0.4em] uppercase mb-4">
              Explorify Trips
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Explore{" "}
              <span className="text-primary italic">Amazing</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-cyan-500">
                Destinations
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mt-4">
              Discover handpicked travel experiences curated just for those who
              seek the extraordinary.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full mt-4">
            <TripSearchBar
              onFilterResult={handleNLFilterResult}
              availableOptions={{
                categories: filterOptions.categories,
                interests: filterOptions.interests,
                languages: filterOptions.languages,
              }}
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter Sidebar */}
            <TripFilterSidebar
              filter={filter}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* Main content */}
            <main className="flex-1">
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">
                    {filteredPlans.length}
                  </span>{" "}
                  {filteredPlans.length === 1 ? "trip" : "trips"} found
                  {activeFilterCount > 0 && (
                    <span className="text-primary ml-1">
                      · {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} active
                    </span>
                  )}
                </p>

                {/* Mobile filter toggle */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 border border-border/10 text-sm text-foreground hover:border-primary/30 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Trips Grid */}
              {filteredPlans.length === 0 ? (
                <div className="max-w-md mx-auto bg-card/40 backdrop-blur-lg border border-border/10 rounded-2xl p-12 text-center">
                  <h2 className="text-xl font-bold mb-3">No trips match your filters</h2>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your filters or search query to find more trips.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredPlans.map((plan, index) => (
                    <TripCard key={plan.planId} plan={plan} index={index} />
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ──

function LoadingSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-[260px] shrink-0">
        <div className="bg-card/40 rounded-2xl p-5 space-y-6 animate-pulse">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="space-y-3">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-muted rounded-lg" />
              <div className="h-8 bg-muted rounded-lg" />
              <div className="h-8 bg-muted rounded-lg" />
              <div className="h-8 bg-muted rounded-lg" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card/40 rounded-[24px] overflow-hidden animate-pulse"
          >
            <div className="h-[240px] bg-muted" />
            <div className="p-6 space-y-4">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded-md" />
                <div className="h-5 w-16 bg-muted rounded-md" />
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-border/10">
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="h-9 w-28 bg-muted rounded-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pure filter function ──

function filterPlans(plans: DynamoDBPlan[], filter: TripFilter): DynamoDBPlan[] {
  return plans.filter((plan) => {
    // Price filter
    if (filter.priceMin != null && plan.price < filter.priceMin) return false;
    if (filter.priceMax != null && plan.price > filter.priceMax) return false;

    // Duration filter (normalize to days)
    if (filter.durationMin != null || filter.durationMax != null) {
      const days = normalizeToDays(plan.duration.value, plan.duration.unit);
      if (filter.durationMin != null && days < filter.durationMin) return false;
      if (filter.durationMax != null && days > filter.durationMax) return false;
    }

    // Categories (OR within — plan must have at least one matching category)
    if (filter.categories && filter.categories.length > 0) {
      const planCats = plan.categories || [];
      if (!filter.categories.some((c) => planCats.includes(c))) return false;
    }

    // Interests (OR within)
    if (filter.interests && filter.interests.length > 0) {
      const planInterests = plan.interests || [];
      if (!filter.interests.some((i) => planInterests.includes(i))) return false;
    }

    // Languages (OR within)
    if (filter.languages && filter.languages.length > 0) {
      const planLangs = plan.languages || [];
      if (!filter.languages.some((l) => planLangs.includes(l))) return false;
    }

    // Starting point (fuzzy / case-insensitive contains)
    if (filter.startingPoint && filter.startingPoint.length > 0) {
      const needle = filter.startingPoint.toLowerCase();
      const haystack = [
        plan.startingPoint || "",
        plan.endingPoint || "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    // Text search (across name, description, highlights)
    if (filter.textSearch && filter.textSearch.length > 0) {
      const needle = filter.textSearch.toLowerCase();
      const haystack = [
        plan.name,
        plan.description,
        ...(plan.highlights || []),
        ...(plan.categories || []),
        ...(plan.interests || []),
        plan.startingPoint || "",
        plan.endingPoint || "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

function normalizeToDays(
  value: number,
  unit: "hours" | "days" | "nights",
): number {
  switch (unit) {
    case "hours":
      return Math.ceil(value / 24);
    case "nights":
      return value + 1; // n nights ≈ n+1 days
    case "days":
    default:
      return value;
  }
}
