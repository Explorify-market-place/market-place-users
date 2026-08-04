"use client";

import { useState, useCallback } from "react";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import type { TripFilter } from "@/types/filter-types";

interface TripSearchBarProps {
  onFilterResult: (filter: TripFilter) => void;
  availableOptions: {
    categories: string[];
    interests: string[];
    languages: string[];
  };
}

export default function TripSearchBar({
  onFilterResult,
  availableOptions,
}: TripSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/trips/search/nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          availableOptions,
        }),
      });

      if (!res.ok) {
        // Fallback to text search
        onFilterResult({ textSearch: trimmed });
        return;
      }

      const data = await res.json();
      onFilterResult(data.filter || { textSearch: trimmed });
    } catch {
      // Network error — fallback to text search
      onFilterResult({ textSearch: trimmed });
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading, availableOptions, onFilterResult]);

  const handleClear = useCallback(() => {
    setQuery("");
    onFilterResult({});
  }, [onFilterResult]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-card/60 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-border/10">
        {/* Search icon + input */}
        <div className="flex-1 flex items-center px-4 gap-3">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Where do you want to explore?"
            className="bg-transparent border-none text-foreground text-sm w-full placeholder:text-muted-foreground/50 focus:outline-none"
            disabled={isLoading}
          />
          {/* Clear button */}
          {query.length > 0 && !isLoading && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border/20 hidden md:block" />

        {/* AI indicator */}
        <div className="hidden md:flex items-center px-3 gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            AI Search
          </span>
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={isLoading || query.trim().length === 0}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Searching</span>
            </>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </div>
  );
}
