import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

export const NotificationBell: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const render = (n: { key?: string | null; params?: Record<string, unknown> | null; title: string; body?: string }) => {
    if (!n.key) return { title: n.title, body: n.body };
    const p = { ...(n.params || {}) } as Record<string, unknown>;
    if (p.status) p.status = t(`status_${p.status}`);
    return { title: t(`${n.key}Title`, p), body: t(`${n.key}Body`, p) };
  };
  const unread = notifications.filter((n) => !n.read);

  const markAll = async () => {
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition"
        aria-label={t('notifications')}
      >
        <Bell className="w-6 h-6" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-200">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-medium text-gray-900">{t('notifications')}</span>
            {unread.length > 0 && (
              <button onClick={markAll} className="text-xs text-blue-600 hover:underline">{t('markAllRead')}</button>
            )}
          </div>
          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">{t('noNotifications')}</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-3 border-b cursor-pointer ${n.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="font-medium text-sm text-gray-900">{render(n).title}</div>
                  {render(n).body && <div className="text-xs text-gray-600 mt-1">{render(n).body}</div>}
                  {n.created_at && (
                    <div className="text-[11px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString(i18n.language === 'en' ? 'en-IN' : `${i18n.language}-IN`)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
