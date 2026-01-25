import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
              <span className="text-sm font-medium text-primary">
                ✨ Explore the World with Confidence
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-slide-down">
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Discover Your Next
              </span>
              <br />
              <span className="text-foreground">Adventure</span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
              Book unforgettable trips to destinations worldwide. From hidden
              gems to popular attractions, your perfect journey awaits.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
              <Link
                href="/trips"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-center"
              >
                Explore Trips →
              </Link>
              <Link
                href="/auth/sign-in"
                className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-border/50 hover:border-primary/50 bg-background/60 backdrop-blur-sm font-semibold hover:bg-accent/50 transition-all duration-200 text-center"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto">
            {[
              {
                icon: "🌍",
                title: "Global Destinations",
                description:
                  "Access hundreds of curated trips across continents",
              },
              {
                icon: "⚡",
                title: "Instant Booking",
                description: "Quick and secure reservation process",
              },
              {
                icon: "🛡️",
                title: "Verified Operators",
                description: "All tour operators are thoroughly vetted",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-background/40 backdrop-blur-lg border border-border/30 rounded-2xl p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-200 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
