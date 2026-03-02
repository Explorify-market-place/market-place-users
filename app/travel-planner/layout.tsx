"use client";

import { TravelPlannerProvider } from "@/components/travel-planner/travel-planner-context";

export default function TravelPlannerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <TravelPlannerProvider>{children}</TravelPlannerProvider>;
}
