import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-border/30 bg-background/40 backdrop-blur-lg mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Policy Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link
              href="https://merchant.razorpay.com/policy/Rn6lxkXvDOSLbk/shipping"
              className="text-muted-foreground hover:text-primary transition-colors hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shipping Policy
            </Link>
            <span className="text-border/50">•</span>
            <Link
              href="https://merchant.razorpay.com/policy/Rn6lxkXvDOSLbk/terms"
              className="text-muted-foreground hover:text-primary transition-colors hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms and Conditions
            </Link>
            <span className="text-border/50">•</span>
            <Link
              href="https://merchant.razorpay.com/policy/Rn6lxkXvDOSLbk/refund"
              className="text-muted-foreground hover:text-primary transition-colors hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cancellation & Refunds
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              ExplorifyTrips
            </span>
            . All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
