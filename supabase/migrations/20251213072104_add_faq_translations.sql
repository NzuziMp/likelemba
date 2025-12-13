/*
  # Add FAQ Translations

  1. Changes
    - Add translation columns to faq_questions table for French, Arabic, and Portuguese
    - Update existing FAQs with translations
    - Modify indexes to support multilingual search

  2. Security
    - No changes to RLS policies
*/

-- Add translation columns to faq_questions
ALTER TABLE faq_questions
ADD COLUMN IF NOT EXISTS question_fr text,
ADD COLUMN IF NOT EXISTS answer_fr text,
ADD COLUMN IF NOT EXISTS question_ar text,
ADD COLUMN IF NOT EXISTS answer_ar text,
ADD COLUMN IF NOT EXISTS question_pt text,
ADD COLUMN IF NOT EXISTS answer_pt text;

-- Update existing FAQs with translations
UPDATE faq_questions SET
  question_fr = 'Qu''est-ce que Likelemba ?',
  answer_fr = 'Likelemba est un système de gestion d''association rotative d''épargne et de crédit (ROSCA). Il aide les groupes de personnes à mettre leur argent en commun et à recevoir à tour de rôle le montant total collecté. C''est une méthode d''épargne traditionnelle rendue numérique et facile à gérer.',
  question_ar = 'ما هو ليكيلمبا؟',
  answer_ar = 'ليكيلمبا هو نظام لإدارة جمعية الادخار والائتمان الدوارة (ROSCA). يساعد مجموعات من الأشخاص على تجميع أموالهم معًا وتلقي المبلغ الإجمالي المحصل بالتناوب. إنها طريقة ادخار تقليدية أصبحت رقمية وسهلة الإدارة.',
  question_pt = 'O que é Likelemba?',
  answer_pt = 'Likelemba é um sistema de gestão de associação rotativa de poupança e crédito (ROSCA). Ajuda grupos de pessoas a juntar seu dinheiro e receber o valor total coletado por turnos. É um método tradicional de poupança tornado digital e fácil de gerenciar.'
WHERE question = 'What is Likelemba?';

UPDATE faq_questions SET
  question_fr = 'Comment créer un groupe ?',
  answer_fr = 'Pour créer un groupe, accédez à votre tableau de bord et cliquez sur "Créer un nouveau groupe". Remplissez les détails du groupe, y compris le nom, le nombre de membres, le montant mensuel, la fréquence de paiement et la date de début. Une fois créé, vous pouvez ajouter des membres au groupe.',
  question_ar = 'كيف أقوم بإنشاء مجموعة؟',
  answer_ar = 'لإنشاء مجموعة، انتقل إلى لوحة التحكم الخاصة بك وانقر على "إنشاء مجموعة جديدة". املأ تفاصيل المجموعة بما في ذلك الاسم وعدد الأعضاء والمبلغ الشهري وتكرار الدفع وتاريخ البدء. بمجرد إنشائها، يمكنك إضافة أعضاء إلى المجموعة.',
  question_pt = 'Como criar um grupo?',
  answer_pt = 'Para criar um grupo, vá ao seu Painel e clique em "Criar Novo Grupo". Preencha os detalhes do grupo, incluindo nome, número de membros, valor mensal, frequência de pagamento e data de início. Depois de criado, você pode adicionar membros ao grupo.'
WHERE question = 'How do I create a group?';

UPDATE faq_questions SET
  question_fr = 'Comment fonctionne le cycle de paiement ?',
  answer_fr = 'Chaque membre contribue un montant fixe selon la fréquence de paiement (quotidienne, hebdomadaire ou mensuelle). Les membres reçoivent à tour de rôle le montant total en fonction de leur ordre de réception. Le cycle continue jusqu''à ce que tous les membres aient reçu leur paiement.',
  question_ar = 'كيف تعمل دورة الدفع؟',
  answer_ar = 'يساهم كل عضو بمبلغ ثابت وفقًا لتكرار الدفع (يومي أو أسبوعي أو شهري). يتلقى الأعضاء بالتناوب المجموع الإجمالي بناءً على ترتيب استلامهم. تستمر الدورة حتى يتلقى جميع الأعضاء دفعتهم.',
  question_pt = 'Como funciona o ciclo de pagamento?',
  answer_pt = 'Cada membro contribui com um valor fixo de acordo com a frequência de pagamento (diária, semanal ou mensal). Os membros recebem o valor total do pool por turnos com base em sua ordem de recebimento. O ciclo continua até que todos os membros tenham recebido seu pagamento.'
WHERE question = 'How does the payment cycle work?';

UPDATE faq_questions SET
  question_fr = 'Puis-je mettre un groupe en pause ?',
  answer_fr = 'Oui ! En tant que créateur du groupe, vous pouvez mettre un groupe en pause depuis la page Membres. Lorsqu''il est en pause, tous les calendriers de paiement sont suspendus. Lorsque vous reprenez, le système ajuste automatiquement toutes les dates de paiement futures en fonction de la durée de la pause.',
  question_ar = 'هل يمكنني إيقاف مجموعة مؤقتًا؟',
  answer_ar = 'نعم! بصفتك منشئ المجموعة، يمكنك إيقاف المجموعة مؤقتًا من صفحة الأعضاء. عند الإيقاف المؤقت، يتم تعليق جميع جداول الدفع. عند الاستئناف، يقوم النظام تلقائيًا بتعديل جميع تواريخ الدفع المستقبلية بناءً على مدة الإيقاف المؤقت.',
  question_pt = 'Posso pausar um grupo?',
  answer_pt = 'Sim! Como criador do grupo, você pode pausar um grupo na página de Membros. Quando pausado, todos os cronogramas de pagamento são suspensos. Ao retomar, o sistema ajusta automaticamente todas as datas de pagamento futuras com base em quanto tempo o grupo ficou pausado.'
WHERE question = 'Can I pause a group?';

UPDATE faq_questions SET
  question_fr = 'Comment suivre les paiements ?',
  answer_fr = 'Vous pouvez suivre tous les paiements depuis la page Suivi des paiements. Cette page affiche l''historique des paiements de chaque membre, les paiements en attente et les paiements en retard. Vous pouvez également enregistrer les paiements et afficher des statistiques détaillées.',
  question_ar = 'كيف أتتبع المدفوعات؟',
  answer_ar = 'يمكنك تتبع جميع المدفوعات من صفحة تتبع المدفوعات. تعرض هذه الصفحة سجل الدفع لكل عضو والمدفوعات المعلقة والمدفوعات المتأخرة. يمكنك أيضًا تسجيل المدفوعات وعرض إحصائيات مفصلة.',
  question_pt = 'Como acompanho os pagamentos?',
  answer_pt = 'Você pode acompanhar todos os pagamentos na página Rastreamento de Pagamentos. Esta página mostra o histórico de pagamentos de cada membro, pagamentos pendentes e pagamentos atrasados. Você também pode registrar pagamentos e visualizar estatísticas detalhadas.'
WHERE question = 'How do I track payments?';

UPDATE faq_questions SET
  question_fr = 'Puis-je exporter les données de mon groupe ?',
  answer_fr = 'Oui ! Vous pouvez exporter les données de votre groupe au format Excel depuis les pages Membres et Suivi des paiements. Le fichier exporté comprend toutes les informations des membres, les historiques de paiement et les statistiques financières.',
  question_ar = 'هل يمكنني تصدير بيانات مجموعتي؟',
  answer_ar = 'نعم! يمكنك تصدير بيانات مجموعتك بتنسيق Excel من صفحات الأعضاء وتتبع المدفوعات. يتضمن الملف المصدر جميع معلومات الأعضاء وسجلات الدفع والإحصائيات المالية.',
  question_pt = 'Posso exportar os dados do meu grupo?',
  answer_pt = 'Sim! Você pode exportar os dados do seu grupo em formato Excel das páginas Membros e Rastreamento de Pagamentos. O arquivo exportado inclui todas as informações dos membros, históricos de pagamento e estatísticas financeiras.'
WHERE question = 'Can I export my group data?';

UPDATE faq_questions SET
  question_fr = 'Comment puis-je partager mon groupe avec d''autres ?',
  answer_fr = 'Vous pouvez partager votre groupe en générant un lien de partage depuis la page Membres. Les autres peuvent voir les détails de votre groupe en lecture seule en utilisant ce lien. Vous pouvez révoquer le lien à tout moment.',
  question_ar = 'كيف يمكنني مشاركة مجموعتي مع الآخرين؟',
  answer_ar = 'يمكنك مشاركة مجموعتك عن طريق إنشاء رابط مشاركة من صفحة الأعضاء. يمكن للآخرين عرض تفاصيل مجموعتك للقراءة فقط باستخدام هذا الرابط. يمكنك إلغاء الرابط في أي وقت.',
  question_pt = 'Como posso compartilhar meu grupo com outras pessoas?',
  answer_pt = 'Você pode compartilhar seu grupo gerando um link de compartilhamento na página Membros. Outros podem visualizar os detalhes do seu grupo somente leitura usando este link. Você pode revogar o link a qualquer momento.'
WHERE question = 'How can I share my group with others?';

UPDATE faq_questions SET
  question_fr = 'Est-ce sécurisé ?',
  answer_fr = 'Oui ! Likelemba utilise un cryptage de niveau bancaire et des mesures de sécurité de pointe pour protéger vos données. Toutes les informations sensibles sont cryptées et stockées en toute sécurité. Nous ne stockons jamais les détails de paiement.',
  question_ar = 'هل هو آمن؟',
  answer_ar = 'نعم! يستخدم ليكيلمبا تشفيرًا على مستوى البنوك وإجراءات أمان متطورة لحماية بياناتك. يتم تشفير جميع المعلومات الحساسة وتخزينها بشكل آمن. نحن لا نخزن أبدًا تفاصيل الدفع.',
  question_pt = 'É seguro?',
  answer_pt = 'Sim! O Likelemba usa criptografia de nível bancário e medidas de segurança de última geração para proteger seus dados. Todas as informações confidenciais são criptografadas e armazenadas com segurança. Nunca armazenamos detalhes de pagamento.'
WHERE question = 'Is it secure?';

-- Create indexes for multilingual search support
CREATE INDEX IF NOT EXISTS idx_faq_questions_fr ON faq_questions USING gin(to_tsvector('french', coalesce(question_fr, '') || ' ' || coalesce(answer_fr, '')));
CREATE INDEX IF NOT EXISTS idx_faq_questions_ar ON faq_questions USING gin(to_tsvector('arabic', coalesce(question_ar, '') || ' ' || coalesce(answer_ar, '')));
CREATE INDEX IF NOT EXISTS idx_faq_questions_pt ON faq_questions USING gin(to_tsvector('portuguese', coalesce(question_pt, '') || ' ' || coalesce(answer_pt, '')));