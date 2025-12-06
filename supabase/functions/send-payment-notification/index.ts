import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentNotification {
  groupName: string;
  memberName: string;
  amount: number;
  paymentDate: string;
  memberEmails: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { groupName, memberName, amount, paymentDate, memberEmails }: PaymentNotification = await req.json();

    if (!groupName || !memberName || !amount || !paymentDate || !memberEmails) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailBody = `
Dear Likelemba Member,\n\n
A payment has been recorded for ${groupName}:\n\n
Member: ${memberName}\n
Amount: $${amount.toFixed(2)}\n
Date: ${formattedDate}\n\n
This notification confirms that the payment has been successfully recorded.\n\n
Best regards,\n
The Likelemba Team
    `;

    console.log(`Payment notification:`);
    console.log(`Group: ${groupName}`);
    console.log(`Member: ${memberName}`);
    console.log(`Amount: $${amount.toFixed(2)}`);
    console.log(`Date: ${formattedDate}`);
    console.log(`Recipients: ${memberEmails.length} members`);
    console.log('\nNote: Email sending is simulated. In production, integrate with an email service provider.');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification logged for ${memberEmails.length} members`,
        data: {
          groupName,
          memberName,
          amount,
          paymentDate: formattedDate,
          recipientCount: memberEmails.length,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error processing payment notification:', error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
