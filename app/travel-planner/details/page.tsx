import Image from "next/image";
import TripFormWizard from "@/components/travel-planner/TripFormWizard";

export const metadata = {
    title: "Plan Your Trip — Explorify Trips",
    description:
        "Tell us where you're going, your dates, travellers and budget — and we'll craft the perfect itinerary.",
};

export default function TravelPlannerDetailsPage() {
    return (
        <div className="relative min-h-screen">
            {/* ── Hero background ── */}
            <div className="fixed inset-0 -z-10">
                <Image
                    src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600"
                    alt="Travel backdrop"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 flex flex-col items-center px-4 pt-28 pb-20">
                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-3 drop-shadow-lg">
                    Plan your{" "}
                    <span className="text-[#FF5A1F]">dream trip</span>
                </h1>
                <p className="text-white/80 text-center text-sm md:text-base mb-10 max-w-md">
                    We&apos;ll craft the perfect itinerary for you, with best booking links across all providers.
                </p>

                {/* Card */}
                <div className="w-full max-w-xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/50 px-6 md:px-10 py-10">
                    <TripFormWizard />
                </div>
            </div>
        </div>
    );
}
