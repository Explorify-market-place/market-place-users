"use client";

import { type HotelDetails } from "../plan-types";
import { Star, ExternalLink } from "lucide-react";

function HotelCard({ h }: { h: HotelDetails }) {
    return (
        <div className="tp-hotel-card group">
            {/* Image */}
            {h.image_url && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3">
                    <img
                        src={h.image_url}
                        alt={h.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                </div>
            )}

            {/* Name */}
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">
                {h.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.round(h.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-300 dark:text-gray-600"
                            }`}
                    />
                ))}
                <span className="text-xs text-gray-500 ml-1">{h.rating}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
                {h.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="font-bold text-[#FF5A1F] text-sm">{h.price}</span>
                <a
                    href={h.booking_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Book <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}

export default function HotelSection({ hotels }: { hotels: HotelDetails[] }) {
    if (hotels.length === 0) return null;

    return (
        <section className="tp-section">
            <h2 className="tp-section-title">🏨 Hotels</h2>
            <div className="tp-hscroll">
                {hotels.map((h, i) => (
                    <HotelCard key={i} h={h} />
                ))}
            </div>
        </section>
    );
}
