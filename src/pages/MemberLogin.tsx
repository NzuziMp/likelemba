import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, LogIn, Info } from 'lucide-react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { supabase } from '../lib/supabase';

export const MemberLogin = () => {
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedMemberId = memberId.trim().toUpperCase();

      if (!formattedMemberId.match(/^LK-[A-Z0-9]{6}$/)) {
        setError('Invalid Member ID format. Must be: LK-XXXXXX (e.g., LK-A3B9F2)');
        setLoading(false);
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('member_id', formattedMemberId)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!member) {
        setError('Member ID not found. Please check your ID and try again.');
        setLoading(false);
        return;
      }

      const sessionToken = crypto.randomUUID();

      const { data: session, error: sessionError } = await supabase
        .from('member_id_sessions')
        .insert({
          member_id: formattedMemberId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      localStorage.setItem('member_session_token', session.session_token);
      localStorage.setItem('member_id_code', formattedMemberId);
      localStorage.setItem('member_uuid', member.id);

      navigate('/member-portal');
    } catch (err: any) {
      console.error('Member login error:', err);
      setError(err.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Member Login</h1>
              <p className="text-slate-600 dark:text-slate-300">Enter your Member ID to access your group</p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">What is a Member ID?</p>
                  <p>Your Member ID is a unique code (e.g., LK-A3B9F2) provided by your group organizer. Check your email or ask your organizer if you don't have it.</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="memberId" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Member ID
                </label>
                <input
                  type="text"
                  id="memberId"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase font-mono text-lg"
                  placeholder="LK-XXXXXX"
                  required
                  maxLength={9}
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Format: LK-XXXXXX (case-insensitive)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Logging in...'
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login as Member
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you a group organizer?{' '}
                <a href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
