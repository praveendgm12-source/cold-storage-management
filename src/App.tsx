import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { AuthForm } from './components/Auth/AuthForm';
import { StorageOwnerDashboard } from './components/StorageOwner/StorageOwnerDashboard';
import { FarmerDashboard } from './components/Farmer/FarmerDashboard';
import './lib/i18n';
import { useTranslation } from 'react-i18next';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();
  const { notifications, markAsRead } = useNotifications();
  const [showNotif, setShowNotif] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm />;
  }

  if (profile.role === 'storageOwner') {
    return <StorageOwnerDashboard />;
  }

  if (profile.role === 'farmer') {
    return <FarmerDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Notification indicator (lightweight UI) */}
      {notifications && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowNotif((s) => !s)}
            className="relative bg-white p-2 rounded-full shadow hover:shadow-md"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{notifications.length}</span>
            )}
          </button>

          {showNotif && (
            <div className="mt-2 w-80 bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-3 border-b font-medium">{t('notifications')}</div>
              <div className="max-h-64 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">{t('noNotifications')}</div>
                ) : (
                  notifications.map((n: { id: string; title: string; body?: string; read?: boolean }) => (
                    <div key={n.id} className={`p-3 border-b ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                      <div className="font-medium text-sm">{n.title}</div>
                      {n.body && <div className="text-xs text-gray-600 mt-1">{n.body}</div>}
                      {!n.read && (
                        <div className="mt-2">
                          <button onClick={() => markAsRead(n.id)} className="text-xs text-blue-600">{t('markAllRead')}</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('invalidRole')}</h1>
        <p className="text-gray-600 mt-2">{t('contactSupport')}</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
