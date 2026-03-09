"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import ProfileMenu from "./ProfileMenu";
import { MapPin, Ticket, Compass } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: "/trips", label: "Browse Trips", icon: MapPin },
    { href: "/travel-planner", label: "Travel Planner", icon: Compass },
    { href: "/bookings", label: "My Bookings", icon: Ticket },
  ];

  return (
    <>
      {/* ── Brand Bar (static, part of page flow) ── */}
      <div className="relative z-40 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg hover:scale-105 transition-transform duration-200 shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              E
            </div>
            <span className="bg-linear-to-r from-blue-700 to-blue-900 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
              ExplorifyTrips
            </span>
          </Link>

          {/* Profile / Sign In */}
          <div className="flex items-center gap-3 shrink-0">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : session ? (
              <ProfileMenu user={session.user} />
            ) : (
              <Link href="/auth/sign-in">
                <Button
                  size="sm"
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 shadow-md"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Nav Links (desktop) ── */}
      {session && (
        <div className="hidden lg:flex fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <nav className="flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/60 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 hover:scale-105
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Mobile Navigation Bar (bottom) ── */}
      {session && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xl z-50">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
