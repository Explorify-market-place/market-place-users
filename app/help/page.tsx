export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">How do I book a trip?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Browse available trips on the Trips page, select your desired
                departure date, and complete the booking process.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">
                How can I view my bookings?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Visit the "My Bookings" page to see all your current and past
                bookings.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">
                What is the cancellation policy?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Cancellation policies vary by trip. Please check the specific
                trip details for cancellation terms.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Need more help? Contact our support team at{" "}
            <a
              href="mailto:support@explorifytrips.com"
              className="text-blue-600 hover:underline"
            >
              support@explorifytrips.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
