import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';

import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { LikeLemba } from './pages/Likelemba';
import { Members } from './pages/Members';
import { SharedGroup } from './pages/SharedGroup';
import { Profile } from './pages/Profile';
import { PaymentTracking } from './pages/PaymentTracking';
import PayoutHistory from './pages/PayoutHistory';
import { MemberLogin } from './pages/MemberLogin';
import { MemberPortal } from './pages/MemberPortal';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import GroupManagement from './pages/admin/GroupManagement';
import MessageManagement from './pages/admin/MessageManagement';
import ActivityLog from './pages/admin/ActivityLog';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AdminProvider>
              <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/member-login" element={<MemberLogin />} />
          <Route path="/member-portal" element={<MemberPortal />} />
          <Route path="/shared/:token" element={<SharedGroup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/likelemba"
            element={
              <ProtectedRoute>
                <LikeLemba />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-tracking"
            element={
              <ProtectedRoute>
                <PaymentTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payout-history"
            element={
              <ProtectedRoute>
                <PayoutHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <UserManagement />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <ProtectedAdminRoute>
                <GroupManagement />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedAdminRoute>
                <MessageManagement />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <ProtectedAdminRoute>
                <ActivityLog />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
            </AdminProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
