import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PublicLayout } from '../components/Layout/PublicLayout';

export const TestAuth = () => {
  const { user, profile, session } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      auth: {},
      database: {},
    };

    results.environment.supabaseUrl = import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing';
    results.environment.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing';

    const { data: sessionData } = await supabase.auth.getSession();
    results.auth.hasSession = !!sessionData.session;
    results.auth.userId = sessionData.session?.user?.id || 'None';
    results.auth.userEmail = sessionData.session?.user?.email || 'None';

    try {
      const { data: groups, error: groupsError } = await supabase
        .from('likelemba_groups')
        .select('id, name, creator_id, status');

      results.database.groupsQuery = {
        success: !groupsError,
        error: groupsError?.message,
        count: groups?.length || 0,
        groups: groups || [],
      };
    } catch (err: any) {
      results.database.groupsQuery = {
        success: false,
        error: err.message,
      };
    }

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');

      results.database.profilesQuery = {
        success: !profilesError,
        error: profilesError?.message,
        count: profiles?.length || 0,
      };
    } catch (err: any) {
      results.database.profilesQuery = {
        success: false,
        error: err.message,
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, [user]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Authentication & Data Test
            </h1>

            <div className="space-y-6">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Current Status
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Logged In:</span>{' '}
                    <span className={user ? 'text-green-600' : 'text-red-600'}>
                      {user ? 'Yes' : 'No'}
                    </span>
                  </p>
                  {user && (
                    <>
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Email:</span> {user.email}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">User ID:</span>{' '}
                        <code className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                          {user.id}
                        </code>
                      </p>
                    </>
                  )}
                  {profile && (
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Name:</span> {profile.full_name}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={runTests}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Running Tests...' : 'Run Tests'}
              </button>

              {testResults && (
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Test Results
                  </h2>
                  <pre className="text-xs bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  What This Test Shows
                </h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2 list-disc list-inside">
                  <li>If Supabase environment variables are configured</li>
                  <li>If you're currently authenticated</li>
                  <li>How many groups your account can see (based on RLS)</li>
                  <li>Database connection status</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Existing Accounts
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p className="font-semibold">You can log in with any of these accounts:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>nzuzimpingi2025@gmail.com - Created "Projet A"</li>
                    <li>nzuzimp@gmail.com - Created "Bomoko"</li>
                    <li>benvenutomike@gmail.com - Created "Union fait la force"</li>
                  </ul>
                  <p className="mt-4 text-xs">
                    Note: You'll need the passwords for these accounts. If you don't have them,
                    use the "Forgot Password" link on the login page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
