"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import ProfileMenu from "./ProfileMenu";
import { MapPin, Ticket } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: "/trips", label: "Browse Trips", icon: MapPin },
    { href: "/bookings", label: "My Bookings", icon: Ticket },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 pointer-events-none">
      <div className="mx-auto max-w-7xl rounded-2xl transition-all duration-500 pointer-events-auto border backdrop-blur-md bg-white/70 dark:bg-slate-950/70 shadow-lg border-white/20 dark:border-slate-800/50">
        <div className="px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo Section */}
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

          {/* Center Navigation */}
          {session && (
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
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
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3 shrink-0">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : session ? (
              <ProfileMenu user={session.user} />
            ) : (
              <>
                <Link href="/auth/sign-in">
                  <Button
                    size="sm"
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      {session && (
        <div className="lg:hidden pointer-events-auto fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xl z-50">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
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
    </div>
  );
}
