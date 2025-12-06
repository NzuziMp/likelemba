import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MemberPaymentReminder {
  memberEmail: string;
  memberName: string;
  groupName: string;
  amountDue: number;
  cycleNumber: number;
  paymentFrequency: string;
  dueDate?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { 
      memberEmail, 
      memberName, 
      groupName, 
      amountDue, 
      cycleNumber,
      paymentFrequency,
      dueDate
    }: MemberPaymentReminder = await req.json();

    if (!memberEmail || !memberName || !groupName || !amountDue || !cycleNumber) {
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

    const frequencyText = paymentFrequency === 'daily' ? 'daily' : 
                         paymentFrequency === 'weekly' ? 'weekly' : 'monthly';

    const dueDateText = dueDate ? `\n\nPayment Due Date: ${new Date(dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}` : '';

    const emailBody = `
Dear ${memberName},\n\n
This is a friendly reminder that your ${frequencyText} contribution for the "${groupName}" Likelemba group is due.\n\n
Payment Details:\n
- Cycle: ${cycleNumber}\n
- Amount Due: $${amountDue.toFixed(2)}\n
- Payment Frequency: ${frequencyText.charAt(0).toUpperCase() + frequencyText.slice(1)}${dueDateText}\n\n
Please make your payment as soon as possible to keep the group running smoothly. Your timely contribution ensures that all members receive their payouts on schedule.\n\n
If you have already made this payment, please disregard this message.\n\n
Thank you for your participation in the Likelemba community!\n\n
Best regards,\n
The Likelemba Team
    `;

    console.log(`Payment reminder to member:`);
    console.log(`To: ${memberEmail}`);
    console.log(`Member: ${memberName}`);
    console.log(`Group: ${groupName}`);
    console.log(`Amount: $${amountDue.toFixed(2)}`);
    console.log(`Cycle: ${cycleNumber}`);
    console.log(`Frequency: ${frequencyText}`);
    if (dueDate) {
      console.log(`Due Date: ${dueDate}`);
    }
    console.log('\nEmail Body:');
    console.log(emailBody);
    console.log('\nNote: Email sending is simulated. In production, integrate with an email service provider like SendGrid, AWS SES, or Resend.');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment reminder sent to ${memberEmail}`,
        data: {
          memberEmail,
          memberName,
          groupName,
          amountDue,
          cycleNumber,
          paymentFrequency,
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
    console.error('Error processing member payment reminder:', error);
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
