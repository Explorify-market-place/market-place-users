"use client";

import { useEffect, useRef, useState } from "react";
import { type HotelDetails } from "../plan-types";
import { responseToHtml } from "../response-to-html";
import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    function scroll(dir: 1 | -1) {
        const el = scrollRef.current;
        if (!el) return;
        const next = Math.max(0, Math.min(activeIdx + dir, images.length - 1));
        el.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        setActiveIdx(next);
    }

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3">
            <div
                ref={scrollRef}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollLeft / el.clientWidth);
                    setActiveIdx(idx);
                }}
            >
                {images.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`${alt} — photo ${i + 1}`}
                        className="w-full h-full object-cover flex-shrink-0 snap-center"
                    />
                ))}
            </div>

            {/* Nav arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={() => scroll(-1)}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        disabled={activeIdx === 0}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        disabled={activeIdx === images.length - 1}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <span
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIdx ? "bg-white" : "bg-white/40"}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function HotelCard({ h }: { h: HotelDetails }) {
    const [descHtml, setDescHtml] = useState("");

    useEffect(() => {
        responseToHtml(h.description, false).then(setDescHtml);
    }, [h.description]);

    return (
        <div className="tp-hotel-card group">
            {/* Image carousel */}
            <ImageCarousel images={h.image_urls} alt={h.name} />

            {/* Name */}
            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">
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

            {/* Description (markdown) */}
            <div
                className="tp-prose text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: descHtml }}
            />

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
