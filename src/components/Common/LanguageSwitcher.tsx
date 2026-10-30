import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { LANGUAGES } from '../../lib/i18n';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { i18n, t } = useTranslation();
  return (
    <label className="flex items-center gap-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-1.5">
      <Languages className="w-4 h-4 text-blue-600" />
      {!compact && <span className="sr-only">{t('language')}</span>}
      <select
        aria-label={t('language')}
        value={i18n.language?.slice(0, 2) || 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-transparent outline-none"
      >
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
};
