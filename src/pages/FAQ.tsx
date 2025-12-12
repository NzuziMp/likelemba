import { useState, useEffect, useRef } from 'react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, Send, ThumbsUp, ThumbsDown, Search, X, Loader, BookOpen, HelpCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  isLoading?: boolean;
  helpful?: boolean | null;
}

export const FAQ = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFAQs();
    if (user) {
      fetchChatHistory();
    }
  }, [user]);

  useEffect(() => {
    filterFAQs();
  }, [searchQuery, selectedCategory, faqs]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_questions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      setFaqs(data || []);

      const uniqueCategories = Array.from(new Set(data?.map(faq => faq.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_chat_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      setChatMessages(data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const filterFAQs = () => {
    let filtered = faqs;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    setFilteredFaqs(filtered);
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || isAsking) return;

    if (!user) {
      alert(t('faq.loginPrompt'));
      return;
    }

    const tempMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      question: userQuestion,
      answer: '',
      isLoading: true,
    };

    setChatMessages(prev => [...prev, tempMessage]);
    setUserQuestion('');
    setIsAsking(true);
    setShowChat(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/faq-ai-assistant`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuestion,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();

      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, id: data.chatId, answer: data.answer, isLoading: false }
            : msg
        )
      );
    } catch (error: any) {
      console.error('Error asking question:', error);

      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? {
                ...msg,
                answer: 'Sorry, I encountered an error processing your question. Please try again or browse our FAQ section below.',
                isLoading: false
              }
            : msg
        )
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('faq_chat_history')
        .update({ helpful })
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, helpful } : msg
        )
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const formatCategory = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('faq.title')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">{t('faq.aiAssistant')}</h2>
                </div>
                {user && chatMessages.length > 0 && (
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="px-4 py-2 bg-white/20 hover:bg-white dark:bg-slate-800/30 text-white rounded-lg transition-colors"
                  >
                    {showChat ? t('faq.hideChat') : t('faq.showChat')}
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder={t('faq.askPlaceholder')}
                    className="w-full px-6 py-4 rounded-xl border-0 focus:ring-2 focus:ring-white text-slate-900 dark:text-white placeholder-slate-400"
                    disabled={isAsking}
                  />
                </div>
                <button
                  onClick={handleAskQuestion}
                  disabled={!userQuestion.trim() || isAsking}
                  className="px-6 py-4 bg-white dark:bg-slate-800 text-primary-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isAsking ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>{isAsking ? t('faq.asking') : t('faq.ask')}</span>
                </button>
              </div>

              {!user && (
                <p className="text-white/80 text-sm mt-3">
                  {t('faq.loginPrompt')}
                </p>
              )}
            </div>

            {showChat && chatMessages.length > 0 && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-primary-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-xl">
                          <p className="text-sm">{message.question}</p>
                        </div>
                      </div>

                      {message.isLoading ? (
                        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                          <Loader className="w-4 h-4 animate-spin" />
                          <span className="text-sm">{t('faq.thinking')}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm max-w-xl">
                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{message.answer}</p>
                          </div>
                          {!message.isLoading && message.id && !message.id.startsWith('temp-') && (
                            <div className="flex items-center space-x-2 mt-2 ml-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">{t('faq.wasHelpful')}</span>
                              <button
                                onClick={() => handleFeedback(message.id, true)}
                                className={`p-1 rounded transition-colors ${
                                  message.helpful === true
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, false)}
                                className={`p-1 rounded transition-colors ${
                                  message.helpful === false
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('faq.browseFAQs')}</h2>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('faq.searchPlaceholder')}
                  className="w-full pl-12 pr-10 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t('faq.all')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {formatCategory(category)}
                  </button>
                ))}
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300">{t('faq.noResults')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="group border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-primary-300 transition-colors"
                  >
                    <summary className="cursor-pointer px-6 py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white group-open:text-primary-600">
                          {faq.question}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">
                          {formatCategory(faq.category)}
                        </span>
                      </div>
                      <HelpCircle className="w-5 h-5 text-slate-400 group-open:text-primary-600 ml-4 flex-shrink-0" />
                    </summary>
                    <div className="px-6 py-4 bg-white dark:bg-slate-800">
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-4">{t('faq.stillQuestions')}</p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('faq.contactSupport')}
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
