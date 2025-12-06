import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentDueReminder {
  creatorEmail: string;
  creatorName: string;
  groupName: string;
  beneficiaryName: string;
  amount: number;
  paymentDueDate: string;
  cycleNumber: number;
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
      creatorEmail, 
      creatorName, 
      groupName, 
      beneficiaryName, 
      amount, 
      paymentDueDate,
      cycleNumber 
    }: PaymentDueReminder = await req.json();

    if (!creatorEmail || !groupName || !beneficiaryName || !amount || !paymentDueDate) {
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

    const formattedDate = new Date(paymentDueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailBody = `
Dear ${creatorName},\n\n
This is a reminder that a payment is due for your Likelemba group "${groupName}".\n\n
Payment Details:\n
- Cycle: ${cycleNumber}\n
- Beneficiary: ${beneficiaryName}\n
- Amount Due: $${amount.toFixed(2)}\n
- Payment Date: ${formattedDate}\n\n
Please ensure the payment is made to ${beneficiaryName} on or before the due date.\n\n
You can manage your group and track payments by logging into your Likelemba dashboard.\n\n
Best regards,\n
The Likelemba Team
    `;

    console.log(`Payment due reminder:`);
    console.log(`To: ${creatorEmail}`);
    console.log(`Creator: ${creatorName}`);
    console.log(`Group: ${groupName}`);
    console.log(`Beneficiary: ${beneficiaryName}`);
    console.log(`Amount: $${amount.toFixed(2)}`);
    console.log(`Due Date: ${formattedDate}`);
    console.log(`Cycle: ${cycleNumber}`);
    console.log('\nEmail Body:');
    console.log(emailBody);
    console.log('\nNote: Email sending is simulated. In production, integrate with an email service provider like SendGrid, AWS SES, or Resend.');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment due reminder sent to ${creatorEmail}`,
        data: {
          creatorEmail,
          groupName,
          beneficiaryName,
          amount,
          paymentDueDate: formattedDate,
          cycleNumber,
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
    console.error('Error processing payment due reminder:', error);
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
