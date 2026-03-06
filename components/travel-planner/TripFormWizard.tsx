"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Wallet, ChevronRight, Plane } from "lucide-react";
import { useTravelPlanner } from "./travel-planner-context";

/* ─── Types ─── */
interface TripDetails {
    startingPoint: string;
    destination: string;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    budget: string;
    preferences: string;
}

interface Prediction {
    description: string;
    place_id: string;
}

/* ─── Custom Places Autocomplete Input ─── */
function PlacesInput({
    placeholder,
    value,
    onSelect,
    autoFocus,
}: {
    placeholder: string;
    value: string;
    onSelect: (place: string) => void;
    autoFocus?: boolean;
}) {
    const [query, setQuery] = useState(value);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync external value changes
    useEffect(() => { setQuery(value); }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const fetchPredictions = useCallback(async (input: string) => {
        if (input.trim().length < 2) {
            setPredictions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/places/autocomplete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input }),
            });
            const data = await res.json();
            if (!res.ok) {
                console.error("[Places] Error:", data);
                setPredictions([]);
            } else {
                setPredictions(data.predictions ?? []);
            }
        } catch (e) {
            console.error("[Places] Fetch failed:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    function handleChange(text: string) {
        setQuery(text);
        onSelect(text); // keep parent in sync so "Continue" enables
        setShowDropdown(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPredictions(text), 300);
    }

    function handleSelect(prediction: Prediction) {
        setQuery(prediction.description);
        onSelect(prediction.description);
        setShowDropdown(false);
        setPredictions([]);
    }

    const inputClass =
        "w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 " +
        "placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#FF5A1F]/40 focus:border-[#FF5A1F] transition-all text-sm";

    return (
        <div ref={wrapperRef} className={`relative ${showDropdown ? "z-20" : ""}`}>
            <input
                type="text"
                className={inputClass}
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                autoFocus={autoFocus}
            />

            {/* Dropdown */}
            {showDropdown && (predictions.length > 0 || loading) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    {loading && (
                        <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
                            Searching…
                        </div>
                    )}
                    {predictions.map((p) => (
                        <button
                            key={p.place_id}
                            type="button"
                            onClick={() => handleSelect(p)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200
                                       hover:bg-[#FFF5F0] dark:hover:bg-[#FF5A1F]/10 transition-colors
                                       flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                        >
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            {p.description}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Sub-components ─── */

function NextButton({ onClick, disabled, label = "Continue" }: { onClick: () => void; disabled: boolean; label?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF5A1F] text-white font-semibold text-sm
                       hover:bg-[#e14f1c] disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-lg shadow-[#FF5A1F]/20 hover:shadow-[#FF5A1F]/40 hover:scale-[1.02]"
        >
            {label}
            <ChevronRight className="w-4 h-4" />
        </button>
    );
}

/* ─── Main Wizard ─── */
export default function TripFormWizard() {
    const router = useRouter();
    const { setTripInput } = useTravelPlanner();
    const [step, setStep] = useState(0);
    const [details, setDetails] = useState<TripDetails>({
        startingPoint: "",
        destination: "",
        startDate: "",
        endDate: "",
        adults: 1,
        children: 0,
        budget: "",
        preferences: "",
    });

    const onStartSelect = useCallback((place: string) => {
        setDetails((d) => ({ ...d, startingPoint: place }));
    }, []);
    const onDestSelect = useCallback((place: string) => {
        setDetails((d) => ({ ...d, destination: place }));
    }, []);

    const today = new Date().toISOString().split("T")[0];

    // If there's already a saved session, redirect to the dashboard
    useEffect(() => {
        if (localStorage.getItem("explorify_trip_session")) {
            router.replace("/travel-planner");
        }
    }, [router]);

    const inputClass =
        "w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 " +
        "placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#FF5A1F]/40 focus:border-[#FF5A1F] transition-all text-sm";

    /* ─── Handlers ─── */
    function handleSubmit() {
        setTripInput(details);
        router.push("/travel-planner");
    }

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* ── Step 0: Starting Point ── */}
            <div className={`tp-field-enter relative z-[5] ${step >= 0 ? "tp-field-visible" : ""}`}>

                <PlacesInput
                    placeholder="Search city…"
                    value={details.startingPoint}
                    onSelect={onStartSelect}
                    autoFocus
                />
                {step === 0 && (
                    <NextButton
                        onClick={() => setStep(1)}
                        disabled={!details.startingPoint.trim()}
                    />
                )}
            </div>

            {/* ── Step 1: Destination ── */}
            {step >= 1 && (
                <div className="tp-field-enter tp-field-visible mt-8 relative z-[4]">

                    <PlacesInput
                        placeholder="Search destination…"
                        value={details.destination}
                        onSelect={onDestSelect}
                        autoFocus
                    />
                    {step === 1 && (
                        <NextButton
                            onClick={() => setStep(2)}
                            disabled={!details.destination.trim()}
                        />
                    )}
                </div>
            )}

            {/* ── Step 2: Dates ── */}
            {step >= 2 && (
                <div className="tp-field-enter tp-field-visible mt-8 relative z-[3]">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Start date</label>
                            <input
                                type="date"
                                className={inputClass}
                                min={today}
                                value={details.startDate}
                                onChange={(e) =>
                                    setDetails((d) => ({ ...d, startDate: e.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">End date</label>
                            <input
                                type="date"
                                className={inputClass}
                                min={details.startDate || today}
                                value={details.endDate}
                                onChange={(e) =>
                                    setDetails((d) => ({ ...d, endDate: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                    {step === 2 && (
                        <NextButton
                            onClick={() => setStep(3)}
                            disabled={!details.startDate || !details.endDate}
                        />
                    )}
                </div>
            )}

            {/* ── Step 3: Travellers ── */}
            {step >= 3 && (
                <div className="tp-field-enter tp-field-visible mt-8 relative z-[2]">
                    <div className="flex flex-col gap-4">
                        {/* Adults */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-5 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Adults</p>
                                <p className="text-xs text-gray-400">Age 13+</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDetails((d) => ({
                                            ...d,
                                            adults: Math.max(1, d.adults - 1),
                                        }))
                                    }
                                    className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    −
                                </button>
                                <span className="text-lg font-bold w-6 text-center text-gray-800 dark:text-gray-100">
                                    {details.adults}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDetails((d) => ({
                                            ...d,
                                            adults: d.adults + 1,
                                        }))
                                    }
                                    className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-5 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Children</p>
                                <p className="text-xs text-gray-400">Age 2–12</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDetails((d) => ({
                                            ...d,
                                            children: Math.max(0, d.children - 1),
                                        }))
                                    }
                                    className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    −
                                </button>
                                <span className="text-lg font-bold w-6 text-center text-gray-800 dark:text-gray-100">
                                    {details.children}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDetails((d) => ({
                                            ...d,
                                            children: d.children + 1,
                                        }))
                                    }
                                    className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {step === 3 && (
                        <NextButton onClick={() => setStep(4)} disabled={false} />
                    )}
                </div>
            )}

            {/* ── Step 4: Budget & Preferences ── */}
            {step >= 4 && (
                <div className="tp-field-enter tp-field-visible mt-8 relative z-[1]">

                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                            <input
                                type="number"
                                className={inputClass + " pl-9"}
                                placeholder="Total Budget e.g. 50000"
                                min="0"
                                value={details.budget}
                                onChange={(e) =>
                                    setDetails((d) => ({ ...d, budget: e.target.value }))
                                }
                                autoFocus
                            />
                        </div>
                        <div className="relative">
                            <textarea
                                className={inputClass + " resize-none h-24"}
                                placeholder="Any other preferences? (e.g. Vegetarian food only, wheelchair accessible)"
                                value={details.preferences}
                                onChange={(e) =>
                                    setDetails((d) => ({ ...d, preferences: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!details.budget}
                        className="mt-6 w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl
                                   bg-gradient-to-r from-[#FF5A1F] to-[#FF8C42] text-white font-bold text-base
                                   hover:from-[#e14f1c] hover:to-[#e07a35] disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-all duration-300 shadow-xl shadow-[#FF5A1F]/25 hover:shadow-[#FF5A1F]/40 hover:scale-[1.01]"
                    >
                        <Plane className="w-5 h-5" />
                        Plan My Trip
                    </button>
                </div>
            )}

            {/* ── Progress dots ── */}
            <div className="flex items-center justify-center gap-2 mt-10">
                {[0, 1, 2, 3, 4].map((s) => (
                    <div
                        key={s}
                        className={`h-2 rounded-full transition-all duration-300 ${s <= step
                            ? "w-6 bg-[#FF5A1F]"
                            : "w-2 bg-gray-200 dark:bg-gray-700"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
