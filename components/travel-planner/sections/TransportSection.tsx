"use client";

import { type Transports, type TransportDetails } from "../plan-types";
import { Plane, Train, Clock, ExternalLink } from "lucide-react";

function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return iso;
    }
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
    } catch {
        return iso;
    }
}

function duration(dep: string, arr: string): string {
    try {
        const ms = new Date(arr).getTime() - new Date(dep).getTime();
        if (ms <= 0) return "";
        const h = Math.floor(ms / 3600000);
        const m = Math.round((ms % 3600000) / 60000);
        return `${h}h ${m}m`;
    } catch {
        return "";
    }
}

function TransportCard({ t, kind }: { t: TransportDetails; kind: "flight" | "train" }) {
    const Icon = kind === "flight" ? Plane : Train;
    return (
        <div className="tp-transport-card group">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF5A1F]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#FF5A1F]" />
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                    {t.name}
                </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>{formatDate(t.departure_from_source)}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {formatTime(t.departure_from_source)}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    {duration(t.departure_from_source, t.arrival_at_destination)}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {formatTime(t.arrival_at_destination)}
                </span>
                <span>{formatDate(t.arrival_at_destination)}</span>
            </div>

            {t.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {t.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="font-bold text-[#FF5A1F] text-sm">{t.price}</span>
                <a
                    href={t.booking_link}
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

export default function TransportSection({
    title,
    transports,
}: {
    title: string;
    transports: Transports;
}) {
    const flights = transports.flights ?? [];
    const trains = transports.trains ?? [];
    if (flights.length === 0 && trains.length === 0) return null;

    return (
        <section className="tp-section">
            <h2 className="tp-section-title">{title}</h2>
            <div className="tp-hscroll">
                {flights.map((f, i) => (
                    <TransportCard key={`f-${i}`} t={f} kind="flight" />
                ))}
                {trains.map((t, i) => (
                    <TransportCard key={`t-${i}`} t={t} kind="train" />
                ))}
            </div>
        </section>
    );
}
