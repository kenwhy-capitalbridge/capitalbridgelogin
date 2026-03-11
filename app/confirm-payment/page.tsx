import { Suspense } from "react";
import { ConfirmPaymentClient } from "./confirm-payment-client";

export default function ConfirmPaymentPage() {
  return (
    <Suspense>
      <ConfirmPaymentClient />
    </Suspense>
  );
}
