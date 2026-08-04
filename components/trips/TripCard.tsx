"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Image as ImageIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicUrl } from "@/lib/s3";
import type { DynamoDBPlan } from "@/types/dynamodb";

// Rotate accent colors per card for visual variety
const ACCENT_COLORS = [
  {
    badge: "bg-blue-500/10 text-blue-400",
    interest: "bg-purple-500/10 text-purple-400",
    highlight: "text-blue-400",
    price: "text-blue-400",
    button:
      "bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border-blue-500/20",
    hoverTitle: "group-hover:text-blue-400",
  },
  {
    badge: "bg-violet-500/10 text-violet-400",
    interest: "bg-cyan-500/10 text-cyan-400",
    highlight: "text-violet-400",
    price: "text-violet-400",
    button:
      "bg-violet-500/10 hover:bg-violet-500 text-violet-400 hover:text-white border-violet-500/20",
    hoverTitle: "group-hover:text-violet-400",
  },
  {
    badge: "bg-emerald-500/10 text-emerald-400",
    interest: "bg-amber-500/10 text-amber-400",
    highlight: "text-emerald-400",
    price: "text-emerald-400",
    button:
      "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/20",
    hoverTitle: "group-hover:text-emerald-400",
  },
  {
    badge: "bg-rose-500/10 text-rose-400",
    interest: "bg-sky-500/10 text-sky-400",
    highlight: "text-rose-400",
    price: "text-rose-400",
    button:
      "bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border-rose-500/20",
    hoverTitle: "group-hover:text-rose-400",
  },
];

interface TripCardProps {
  plan: DynamoDBPlan;
  index: number;
}

export default function TripCard({ plan, index }: TripCardProps) {
  const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const mainImage = plan.images?.[0]
    ? getPublicUrl(plan.images[0])
    : "/placeholder-trip.jpg";

  return (
    <div className="group flex flex-col bg-card/40 backdrop-blur-lg rounded-[24px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-border/10 hover:border-primary/20">
      {/* Image */}
      <div className="relative h-[240px] overflow-hidden">
        <Image
          src={mainImage}
          alt={plan.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

        {/* Duration badge */}
        <div className="absolute top-5 right-5 px-3.5 py-1.5 bg-background/80 backdrop-blur-md rounded-full border border-border/20 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground uppercase tracking-wide">
            {plan.duration.value} {plan.duration.unit}
          </span>
        </div>

        {/* Image count badge */}
        {plan.images && plan.images.length > 1 && (
          <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white">
              {plan.images.length}
            </span>
          </div>
        )}

        {/* Location overlay at bottom of image */}
        {(plan.startingPoint || plan.endingPoint) && (
          <div className="absolute bottom-4 left-5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium uppercase tracking-widest line-clamp-1">
                {plan.startingPoint && plan.endingPoint
                  ? `${plan.startingPoint} → ${plan.endingPoint}`
                  : plan.startingPoint || plan.endingPoint}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <h2
            className={`text-lg font-bold text-foreground ${colors.hoverTitle} transition-colors line-clamp-1`}
          >
            {plan.name}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {plan.description}
          </p>
        </div>

        {/* Tags */}
        {(plan.categories?.length > 0 || plan.interests?.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {plan.categories?.slice(0, 2).map((category) => (
              <span
                key={category}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${colors.badge}`}
              >
                {category}
              </span>
            ))}
            {plan.interests?.slice(0, 1).map((interest) => (
              <span
                key={interest}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${colors.interest}`}
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Highlights */}
        {plan.highlights && plan.highlights.length > 0 && (
          <ul className="flex flex-col gap-2">
            {plan.highlights.slice(0, 2).map((highlight, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className={`w-4 h-4 shrink-0 ${colors.highlight}`} />
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Spacer to push price/CTA to bottom */}
        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              Starting from
            </span>
            <span className={`text-xl font-bold ${colors.price}`}>
              ₹{plan.price.toLocaleString("en-IN")}
            </span>
          </div>
          <Button
            asChild
            variant="outline"
            className={`rounded-2xl px-6 py-2.5 text-xs font-medium uppercase tracking-widest transition-all border ${colors.button}`}
          >
            <Link href={`/trips/${plan.planId}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
