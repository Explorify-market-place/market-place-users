"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { XCircle, Loader2 } from "lucide-react";

export function CancelBookingButton({
  bookingId,
  tripDate,
  bookingStatus,
}: {
  bookingId: string;
  tripDate: string;
  bookingStatus: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Check if cancellation is allowed
  const tripDateTime = new Date(tripDate).getTime();
  const now = Date.now();
  const hoursUntilTrip = (tripDateTime - now) / (1000 * 60 * 60);

  // Default to "confirmed" if bookingStatus is undefined (for old bookings)
  const status = bookingStatus || "confirmed";
  const canCancel =
    status === "confirmed" && hoursUntilTrip >= 24 && tripDateTime > now;

  const handleCancel = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCancel) {
    return null;
  }

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="lg"
            className="w-full rounded-full"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Cancel Booking
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </p>
              <p className="font-semibold text-foreground">
                You will receive a full refund within 5-7 business days.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Free cancellation up to 24 hours before trip
      </p>
    </div>
  );
}
