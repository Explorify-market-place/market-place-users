import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/common/nav/mode-toggle"

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            ExplorifyTrips
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/trips" className="hover:underline">
              Trips
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button asChild>
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}