"use client";

import { useEffect, useState } from "react";
import { type Activity } from "../plan-types";
import { responseToHtml } from "../response-to-html";
import { MapPin } from "lucide-react";

function DayCard({ activity, dayNum }: { activity: Activity; dayNum: number }) {
    const [html, setHtml] = useState("");

    useEffect(() => {
        responseToHtml(activity.plan, false).then(setHtml);
    }, [activity.plan]);

    return (
        <div className="tp-itinerary-card">
            {/* Day badge */}
            <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FF5A1F] text-white font-bold text-sm shrink-0">
                    {dayNum}
                </span>
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                        Day {dayNum}
                    </p>
                    <h3 className="font-bold text-base text-gray-800 dark:text-gray-100">
                        {activity.title}
                    </h3>
                </div>
            </div>

            {/* Rendered markdown plan */}
            <div
                className="tp-prose text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Google Maps link */}
            {activity.google_map_url && (
                <a
                    href={activity.google_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <MapPin className="w-3.5 h-3.5" />
                    View on Google Maps
                </a>
            )}
        </div>
    );
}

export default function ItinerarySection({
    itinerary,
}: {
    itinerary: Activity[];
}) {
    if (itinerary.length === 0) return null;

    return (
        <section className="tp-section">
            <h2 className="tp-section-title">📋 Itinerary</h2>
            <div className="tp-hscroll">
                {itinerary.map((a, i) => (
                    <DayCard key={i} activity={a} dayNum={i + 1} />
                ))}
            </div>
        </section>
    );
}
