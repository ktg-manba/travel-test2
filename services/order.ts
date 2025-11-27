import {
  CreditsTransType,
  increaseCredits,
  updateCreditForOrder,
} from "./credit";
import { findOrderByOrderNo, updateOrderStatus, updateOrderSubscription } from "@/models/order";
import { getIsoTimestr, getOneYearLaterTimestr } from "@/lib/time";
import { Order } from "@/types/order";
import { getSupabaseClient } from "@/models/db";

import Stripe from "stripe";
import { updateAffiliateForOrder } from "./affiliate";

export async function handleOrderSession(session: Stripe.Checkout.Session) {
  try {
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);

    const order = await findOrderByOrderNo(order_no);
    if (!order || order.status !== "created") {
      throw new Error("invalid order");
    }

    const paid_at = getIsoTimestr();
    
    // If subscription, save subscription ID
    if (session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const supabase = getSupabaseClient();
      await supabase
        .from("orders")
        .update({ sub_id: subscriptionId })
        .eq("order_no", order_no);
    }

    await updateOrderStatus(order_no, "paid", paid_at, paid_email, paid_detail);

    if (order.user_uuid) {
      if (order.credits > 0) {
        // increase credits for paied order
        await updateCreditForOrder(order);
      }

      // update affiliate for paied order
      await updateAffiliateForOrder(order);
    }

    console.log(
      "handle order session successed: ",
      order_no,
      paid_at,
      paid_email,
      paid_detail
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}

// Handle subscription deleted event
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  try {
    console.log("Subscription deleted:", subscription.id);

    // Find order by subscription ID
    const orders = await findOrdersBySubscriptionId(subscription.id);
    if (orders && orders.length > 0) {
      for (const order of orders) {
        await updateOrderStatus(
          order.order_no,
          "cancelled",
          getIsoTimestr(),
          order.user_email,
          JSON.stringify(subscription)
        );
      }
      console.log(`Updated ${orders.length} orders for cancelled subscription`);
    }
  } catch (e) {
    console.log("handle subscription deleted failed: ", e);
    throw e;
  }
}

// Handle subscription updated event
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  try {
    console.log("Subscription updated:", subscription.id);

    // Find order by subscription ID
    const orders = await findOrdersBySubscriptionId(subscription.id);
    if (orders && orders.length > 0) {
      for (const order of orders) {
        // Update subscription details
        const status = subscription.status === "active" ? "paid" : "cancelled";
        const paid_at = getIsoTimestr();
        const intervalCount = subscription.items.data[0]?.price?.recurring?.interval_count || 1;
        
        // updateOrderSubscription parameters:
        // order_no, sub_id, sub_interval_count, sub_cycle_anchor, sub_period_end, 
        // sub_period_start, status, paid_at, sub_times, paid_email, paid_detail
        await updateOrderSubscription(
          order.order_no,
          subscription.id,
          intervalCount,
          subscription.current_period_start, // sub_cycle_anchor
          subscription.current_period_end,   // sub_period_end
          subscription.current_period_start,  // sub_period_start
          status,
          paid_at,
          1, // sub_times
          order.user_email,
          JSON.stringify(subscription)
        );
      }
      console.log(`Updated ${orders.length} orders for subscription update`);
    }
  } catch (e) {
    console.log("handle subscription updated failed: ", e);
    throw e;
  }
}

// Handle invoice payment succeeded (subscription renewal)
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
) {
  try {
    console.log("Invoice payment succeeded:", invoice.id);

    if (invoice.subscription) {
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription.id;

      const orders = await findOrdersBySubscriptionId(subscriptionId);
      if (orders && orders.length > 0) {
        for (const order of orders) {
          // Update order for renewal
          const paid_at = getIsoTimestr();
          await updateOrderStatus(
            order.order_no,
            "paid",
            paid_at,
            order.user_email,
            JSON.stringify(invoice)
          );

          // Increase credits if applicable
          if (order.user_uuid && order.credits > 0) {
            await updateCreditForOrder(order);
          }
        }
        console.log(`Processed renewal for ${orders.length} orders`);
      }
    }
  } catch (e) {
    console.log("handle invoice payment succeeded failed: ", e);
    throw e;
  }
}

// Handle invoice payment failed
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice payment failed:", invoice.id);

    if (invoice.subscription) {
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription.id;

      const orders = await findOrdersBySubscriptionId(subscriptionId);
      if (orders && orders.length > 0) {
        // Update order status to indicate payment failure
        for (const order of orders) {
          await updateOrderStatus(
            order.order_no,
            "payment_failed",
            getIsoTimestr(),
            order.user_email,
            JSON.stringify(invoice)
          );
        }
        console.log(`Marked ${orders.length} orders as payment failed`);
        // TODO: Send notification to user about payment failure
      }
    }
  } catch (e) {
    console.log("handle invoice payment failed error: ", e);
    throw e;
  }
}

// Helper function to find orders by subscription ID
async function findOrdersBySubscriptionId(
  subscriptionId: string
): Promise<Order[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("sub_id", subscriptionId);

    if (error) {
      console.error("Error finding orders by subscription ID:", error);
      return [];
    }

    return (data as Order[]) || [];
  } catch (e) {
    console.error("Error in findOrdersBySubscriptionId:", e);
    return [];
  }
}
