// app/page.tsx

import Image from "next/image";




/* ================= FETCH TRIPS (BACKEND SAFE) ================= */
async function getTrips() {
  try {
    const res = await fetch("/api/trips", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/* ================= DUMMY FALLBACK (GYG-STYLE) ================= */
const dummyTrips = [
  {
    id: "d1",
    title: "Paris: Eiffel Tower Guided Tour",
    duration: "2 hours",
    price: 4599,
    rating: 4.7,
    reviews: 2635,
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
  },
  {
    id: "d2",
    title: "Rome: Colosseum Skip-the-Line Experience",
    duration: "3 hours",
    price: 6299,
    rating: 4.8,
    reviews: 4121,
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
  },
  {
    id: "d3",
    title: "Dubai: Desert Safari with BBQ Dinner",
    duration: "6 hours",
    price: 8999,
    rating: 4.6,
    reviews: 1783,
    image:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800",
  },
  {
    id: "d4",
    title: "New York: Statue of Liberty & Ellis Island",
    duration: "4 hours",
    price: 5299,
    rating: 4.7,
    reviews: 2981,
    image:
      "https://images.unsplash.com/photo-1541336032412-2048a678540d?w=800",
  },
  {
    id: "d5",
    title: "London: Beatles & Abbey Road Walking Tour",
    duration: "2.5 hours",
    price: 2504,
    rating: 4.6,
    reviews: 541,
    image:
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800",
  },
  {
    id: "d6",
    title: "San Diego: USS Midway Museum Entry",
    duration: "Flexible",
    price: 3757,
    rating: 4.9,
    reviews: 3863,
    image:
      "https://images.unsplash.com/photo-1530044426743-4b7125613d93?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c2FuJTIwZGVpZ298ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "d7",
    title: "Amsterdam: Canal Cruise Experience",
    duration: "1 hour",
    price: 2999,
    rating: 4.5,
    reviews: 1221,
    image:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YW1zdGVyZGFtfGVufDB8fDB8fHww",
  },
  {
    id: "d8",
    title: "Paris: Louvre Museum Skip-the-Line",
    duration: "3 hours",
    price: 6700,
    rating: 4.8,
    reviews: 5170,
    image:
      "https://images.unsplash.com/photo-1662326478665-30d6d79f5cda?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGFyaXMlMjBtdXNldW18ZW58MHx8MHx8fDA%3D",
  },
];

const mustSeeAttractions = [
  {
    title: "Statue of Liberty",
    count: 164,
    image:
      "https://images.unsplash.com/photo-1762091409592-ed6d0dfed0ba?q=80&w=680&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Vatican Museums",
    count: 518,
    image:
      "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800",
  },
  {
    title: "Eiffel Tower",
    count: 507,
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
  },
  {
    title: "Metropolitan Museum of Art",
    count: 59,
    image:
      "https://images.unsplash.com/photo-1645793729490-b82a44905e5a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bWV0cm9wb2xpdGFuJTIwbXVzZXVtJTIwb2YlMjBhcnR8ZW58MHx8MHx8fDA%3D",
  },
];


export default async function Home() {
  const backendTrips = await getTrips();
  const trips = backendTrips.length ? backendTrips : dummyTrips;
  const showFallbackSections = backendTrips.length === 0;



  return (
    <div className="bg-white text-black">

      {/* ================= HERO (IMAGE + OVERLAY) ================= */}
      <section className="relative h-[85vh] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600"
          alt="Travel"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 max-w-5xl text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Discover & book{" "}
            <span className="text-[#FF5A1F]">unforgettable experiences</span>
          </h1>

          <p className="text-white/90 text-lg mb-10">
            Find top-rated things to do, tours & activities — trusted worldwide.
          </p>

          <div className="flex bg-white rounded-full shadow-2xl overflow-hidden max-w-3xl mx-auto">
            <input
              className="flex-1 px-6 py-4 text-black outline-none"
              placeholder="Find places and things to do"
            />
            <a
              href="/trips"
              className="bg-[#FF5A1F] px-10 py-4 font-semibold text-white hover:bg-[#e14f1c]"
            >
              Search
            </a>
          </div>
        </div>
      </section>



{/* ================= ATTRACTIONS YOU CAN'T MISS (ONLY WHEN BACKEND EMPTY) ================= */}
{showFallbackSections && (
  <section className="container mx-auto px-4 py-20">
    <div className="flex items-center justify-between mb-10">
      <h2 className="text-4xl font-extrabold">
        Attractions you can’t miss
      </h2>

      {/* Optional arrow like GetYourGuide */}
      <span className="w-12 h-12 rounded-full border flex items-center justify-center text-xl cursor-pointer hover:bg-gray-100">
        →
      </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {mustSeeAttractions.map((item) => (
        <div
          key={item.title}
          className="group cursor-pointer"
        >
          <div className="relative h-48 rounded-2xl overflow-hidden">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
            />
          </div>

          <h3 className="mt-4 font-bold text-lg">
            {item.title}
          </h3>

          <p className="text-gray-500 text-sm">
            {item.count} activities
          </p>
        </div>
      ))}
    </div>
  </section>
)}




      {/* ================= EXPERIENCES ================= */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-extrabold mb-14">
          Unforgettable travel experiences
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {trips.map((trip: any) => (
            <a
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow hover:shadow-2xl transition"
            >
              {/* IMAGE */}
              <div className="relative h-56">
                <Image
                  src={trip.image}
                  alt={trip.title}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />

                {/* BADGES */}
                <span className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full">
                  ✔ Verified by ExplorifyTrips
                </span>

                <span className="absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center text-lg shadow">
                  ♡
                </span>
              </div>

              {/* CONTENT */}
              <div className="p-5">
                <h3 className="font-semibold text-lg leading-snug line-clamp-2 mb-2">
                  {trip.title}
                </h3>

                <p className="text-sm text-gray-500 mb-3">
                  {trip.duration}
                </p>

                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="font-bold">
                    ⭐ {trip.rating}
                  </span>
                  <span className="text-gray-500">
                    ({trip.reviews.toLocaleString()})
                  </span>
                </div>

                <div className="font-bold text-[#FF5A1F] text-lg">
                  From ₹{trip.price}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
