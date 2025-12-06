import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { question, userId } = await req.json();

    if (!question || !userId) {
      return new Response(
        JSON.stringify({ error: 'Question and userId are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: faqs, error: faqError } = await supabase
      .from('faq_questions')
      .select('*')
      .eq('is_active', true);

    if (faqError) throw faqError;

    const answer = generateAnswer(question, faqs || []);

    const { data: chatEntry, error: chatError } = await supabase
      .from('faq_chat_history')
      .insert({
        user_id: userId,
        question,
        answer,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    return new Response(
      JSON.stringify({
        answer,
        chatId: chatEntry.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error processing question:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateAnswer(question: string, faqs: FAQ[]): string {
  const questionLower = question.toLowerCase();

  const relevantFaqs = faqs.filter((faq) => {
    const faqQuestionLower = faq.question.toLowerCase();
    const faqAnswerLower = faq.answer.toLowerCase();
    return (
      faqQuestionLower.includes(questionLower) ||
      questionLower.includes(faqQuestionLower) ||
      hasCommonKeywords(questionLower, faqQuestionLower) ||
      hasCommonKeywords(questionLower, faqAnswerLower)
    );
  });

  if (relevantFaqs.length === 0) {
    return generateGeneralAnswer(questionLower, faqs);
  }

  if (relevantFaqs.length === 1) {
    return relevantFaqs[0].answer;
  }

  let response = "Here's what I found that might help:\n\n";
  relevantFaqs.slice(0, 3).forEach((faq, index) => {
    response += `${index + 1}. **${faq.question}**\n${faq.answer}\n\n`;
  });

  return response;
}

function hasCommonKeywords(text1: string, text2: string): boolean {
  const keywords1 = text1.split(/\s+/).filter((word) => word.length > 3);
  const keywords2 = text2.split(/\s+/).filter((word) => word.length > 3);

  const commonCount = keywords1.filter((word) => keywords2.includes(word)).length;
  return commonCount >= 2;
}

function generateGeneralAnswer(question: string, faqs: FAQ[]): string {
  if (question.includes('create') && question.includes('group')) {
    const faq = faqs.find((f) => f.question.toLowerCase().includes('create'));
    return faq?.answer || getDefaultAnswer('create-group');
  }

  if (question.includes('payment') || question.includes('pay')) {
    const faq = faqs.find((f) => f.category === 'payments');
    return faq?.answer || getDefaultAnswer('payment');
  }

  if (question.includes('member') || question.includes('add')) {
    const faq = faqs.find((f) => f.question.toLowerCase().includes('member'));
    return faq?.answer || getDefaultAnswer('members');
  }

  if (question.includes('pause') || question.includes('stop')) {
    const faq = faqs.find((f) => f.question.toLowerCase().includes('pause'));
    return faq?.answer || getDefaultAnswer('pause');
  }

  if (question.includes('export') || question.includes('report')) {
    const faq = faqs.find((f) => f.question.toLowerCase().includes('export'));
    return faq?.answer || getDefaultAnswer('export');
  }

  if (question.includes('share') || question.includes('link')) {
    const faq = faqs.find((f) => f.question.toLowerCase().includes('share'));
    return faq?.answer || getDefaultAnswer('share');
  }

  return `I couldn't find a specific answer to your question. However, here are some related topics that might help:\n\n${faqs
    .slice(0, 3)
    .map((faq, i) => `${i + 1}. ${faq.question}`)
    .join('\n')}\n\nPlease try rephrasing your question or browse the FAQ section below for more information. You can also contact our support team for personalized assistance.`;
}

function getDefaultAnswer(topic: string): string {
  const defaults: Record<string, string> = {
    'create-group':
      'To create a group, go to your Dashboard and click "Create New Group". Fill in the details including name, number of members, monthly amount, payment frequency, and start date. Once created, you can add members to the group.',
    payment:
      'You can track payments from the Members page. Click "Record Payment" when a member pays their contribution. The system will notify all members and update the payment schedule automatically.',
    members:
      'Add members from the Members page by clicking "Add Member" or import multiple members using an Excel/CSV file. Download the template to ensure correct formatting.',
    pause:
      'As a group creator, you can pause a group from the Members page. When paused, all payment schedules are suspended. When you resume, payment dates are automatically adjusted.',
    export:
      'You can export detailed payment reports in PDF, Excel, or Word format from the Members page. Reports include member details, payment history, and financial summaries.',
    share:
      'Each group has a unique shareable link that you can generate from the Members page. Anyone with the link can view basic group information and the member list.',
  };

  return (
    defaults[topic] ||
    'Please browse our FAQ section below or contact support for more information.'
  );
}
