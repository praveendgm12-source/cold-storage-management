import logoImg from '../../logo.jpg';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Warehouse, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { friendlyError } from '../../lib/i18n';
import { LanguageSwitcher } from '../Common/LanguageSwitcher';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'storageOwner' | 'farmer'>('farmer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('errAllFields'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('errEmail'));
      return;
    }

    if (password.length < 6) {
      setError(t('errPassword'));
      return;
    }

    if (!isLogin && !name.trim()) {
      setError(t('errName'));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, role);
      }
    } catch (err: any) {
      setError(friendlyError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="flex justify-end mb-2"><LanguageSwitcher /></div>
        <div className="text-center mb-8">
          <img
            src={logoImg}
            alt="Coolza Logo"
            className="h-24 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">{t('welcome')}</h1>
          <p className="text-gray-600 mt-2">{t('appTagline')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t('login')}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t('signUp')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder={t('enterName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('iAmA')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('farmer')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        role === 'farmer'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sprout className={`w-6 h-6 mx-auto mb-2 ${role === 'farmer' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${role === 'farmer' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {t('farmer')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('storageOwner')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        role === 'storageOwner'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Warehouse className={`w-6 h-6 mx-auto mb-2 ${role === 'storageOwner' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${role === 'storageOwner' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {t('storageOwner')}
                      </p>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder={t('minChars')}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('pleaseWait') : isLogin ? t('login') : t('createAccount')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
