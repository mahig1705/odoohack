import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

// Create Razorpay order
async function createOrder(amount: number, currency: string, receipt: string) {
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Razorpay order creation failed:", error);
    throw new Error(`Failed to create Razorpay order: ${error}`);
  }

  return response.json();
}

// Verify Razorpay payment signature
function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // For production, implement proper HMAC verification
  // This is a simplified check
  return Boolean(signature && signature.length > 0);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "create-order") {
      const { amount, currency, appointment_type_id, customer_id } = await req.json();

      if (!amount || !currency) {
        return new Response(
          JSON.stringify({ error: "Amount and currency are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`Creating Razorpay order: amount=${amount}, currency=${currency}`);
      
      const order = await createOrder(amount, currency, receipt);
      
      console.log("Razorpay order created:", order.id);

      return new Response(
        JSON.stringify({
          success: true,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: RAZORPAY_KEY_ID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify-payment") {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        booking_id,
        amount,
        currency,
      } = await req.json();

      console.log(`Verifying payment: order=${razorpay_order_id}, payment=${razorpay_payment_id}`);

      // Verify signature
      const isValid = verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        console.error("Invalid payment signature");
        return new Response(
          JSON.stringify({ error: "Invalid payment signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Record payment in database
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id,
          amount,
          currency,
          status: "completed",
          payment_method: "razorpay",
          transaction_id: razorpay_payment_id,
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Failed to record payment:", paymentError);
        return new Response(
          JSON.stringify({ error: "Failed to record payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking_id);

      if (bookingError) {
        console.error("Failed to update booking:", bookingError);
      }

      console.log("Payment verified and recorded:", payment.id);

      return new Response(
        JSON.stringify({
          success: true,
          payment_id: payment.id,
          message: "Payment verified successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in razorpay function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
