import Stripe from "stripe";
import { handleOrderSession } from "@/services/order";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; session_id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("payment.success.title") || "Payment Successful",
    description: t("payment.success.description") || "Your payment was successful",
  };
}

export default async function PaySuccessPage({
  params,
}: {
  params: Promise<{ locale: string; session_id: string }>;
}) {
  const { locale, session_id } = await params;
  const t = await getTranslations({ locale });

  try {
    if (!process.env.STRIPE_PRIVATE_KEY) {
      console.error("STRIPE_PRIVATE_KEY not configured");
      redirect(process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/");
    }

    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      await handleOrderSession(session);
      redirect(process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/my-orders");
    } else {
      // Payment not completed yet, redirect to orders page
      redirect(process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/my-orders");
    }
  } catch (e) {
    console.error("Pay success page error:", e);
    redirect(process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/products");
  }
}

