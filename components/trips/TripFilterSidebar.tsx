"use client";

import { useCallback } from "react";
import { Filter, X } from "lucide-react";
import type { TripFilter, FilterOptions } from "@/types/filter-types";
import { DURATION_PRESETS } from "@/types/filter-types";

interface TripFilterSidebarProps {
  filter: TripFilter;
  filterOptions: FilterOptions;
  onFilterChange: (filter: TripFilter) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function TripFilterSidebar({
  filter,
  filterOptions,
  onFilterChange,
  isOpen,
  onClose,
}: TripFilterSidebarProps) {
  const hasActiveFilters =
    filter.priceMin != null ||
    filter.priceMax != null ||
    filter.durationMin != null ||
    filter.durationMax != null ||
    (filter.categories && filter.categories.length > 0) ||
    (filter.interests && filter.interests.length > 0) ||
    (filter.languages && filter.languages.length > 0) ||
    (filter.startingPoint && filter.startingPoint.length > 0);

  const clearAll = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  // ── Price range ──
  const handlePriceChange = useCallback(
    (value: number) => {
      onFilterChange({ ...filter, priceMax: value });
    },
    [filter, onFilterChange],
  );

  // ── Duration preset toggle ──
  const handleDurationToggle = useCallback(
    (min: number, max: number | null) => {
      // Toggle off if already selected
      if (filter.durationMin === min && filter.durationMax === (max ?? undefined)) {
        const { durationMin: _min, durationMax: _max, ...rest } = filter;
        onFilterChange(rest);
      } else {
        onFilterChange({
          ...filter,
          durationMin: min,
          durationMax: max ?? undefined,
        });
      }
    },
    [filter, onFilterChange],
  );

  const isDurationActive = (min: number, max: number | null) =>
    filter.durationMin === min && filter.durationMax === (max ?? undefined);

  // ── Checkbox toggle (categories / interests / languages) ──
  const handleCheckboxToggle = useCallback(
    (field: "categories" | "interests" | "languages", value: string) => {
      const current = filter[field] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFilterChange({
        ...filter,
        [field]: updated.length > 0 ? updated : undefined,
      });
    },
    [filter, onFilterChange],
  );

  // ── Starting point text ──
  const handleStartingPointChange = useCallback(
    (value: string) => {
      onFilterChange({
        ...filter,
        startingPoint: value.length > 0 ? value : undefined,
      });
    },
    [filter, onFilterChange],
  );

  const sidebarContent = (
    <div className="flex flex-col gap-6 bg-card/40 backdrop-blur-md p-5 rounded-2xl border border-border/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-primary uppercase tracking-[0.2em] flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Close filters"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Price Range
        </label>
        <input
          type="range"
          min={filterOptions.priceRange.min}
          max={filterOptions.priceRange.max}
          step={500}
          value={filter.priceMax ?? filterOptions.priceRange.max}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          className="w-full accent-primary h-1 cursor-pointer rounded-lg appearance-none bg-muted"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>₹{filterOptions.priceRange.min.toLocaleString("en-IN")}</span>
          <span className="text-primary font-medium">
            ₹
            {(filter.priceMax ?? filterOptions.priceRange.max).toLocaleString(
              "en-IN",
            )}
          </span>
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Duration
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleDurationToggle(preset.min, preset.max)}
              className={`px-3 py-2 rounded-lg text-[10px] font-medium uppercase tracking-wider border transition-all ${
                isDurationActive(preset.min, preset.max)
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:text-primary hover:border-primary/30"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {filterOptions.categories.length > 0 && (
        <CheckboxGroup
          label="Categories"
          options={filterOptions.categories}
          selected={filter.categories || []}
          onToggle={(v) => handleCheckboxToggle("categories", v)}
        />
      )}

      {/* Interests */}
      {filterOptions.interests.length > 0 && (
        <CheckboxGroup
          label="Interests"
          options={filterOptions.interests}
          selected={filter.interests || []}
          onToggle={(v) => handleCheckboxToggle("interests", v)}
        />
      )}

      {/* Languages */}
      {filterOptions.languages.length > 0 && (
        <CheckboxGroup
          label="Languages"
          options={filterOptions.languages}
          selected={filter.languages || []}
          onToggle={(v) => handleCheckboxToggle("languages", v)}
        />
      )}

      {/* Starting Point */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Starting Point
        </label>
        <input
          type="text"
          placeholder="e.g. Kashmir, Delhi..."
          value={filter.startingPoint || ""}
          onChange={(e) => handleStartingPointChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors"
        />
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="w-full py-2.5 bg-muted text-foreground text-[11px] font-medium rounded-xl hover:bg-muted/80 transition-colors uppercase tracking-widest"
        >
          Clear All
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0">
        <div className="sticky top-28">{sidebarContent}</div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-[300px] max-w-[85vw] h-full bg-background overflow-y-auto p-4 animate-in slide-in-from-right duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

// ── Checkbox group sub-component ──

function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-col gap-2.5">
        {options.map((option) => {
          const isChecked = selected.includes(option);
          return (
            <label
              key={option}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-[18px] h-[18px] rounded border flex items-center justify-center transition-colors ${
                  isChecked
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/30 group-hover:border-primary"
                }`}
                onClick={() => onToggle(option)}
              >
                <div
                  className={`w-2.5 h-2.5 bg-primary rounded-sm transition-opacity ${
                    isChecked ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <span
                className={`text-sm transition-colors ${
                  isChecked
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
                onClick={() => onToggle(option)}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
