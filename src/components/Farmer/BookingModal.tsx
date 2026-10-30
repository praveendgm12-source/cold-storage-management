import React, { useState } from 'react';
import { StorageUnit } from '../../lib/supabase';
import { createBookingWithTransaction } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Package, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { friendlyError } from '../../lib/i18n';

interface BookingModalProps {
  storage: StorageUnit;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ storage, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const totalCost = Number(quantity) * Number(storage.price_per_kg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const quantityNum = Number(quantity);

    if (!quantity || quantityNum <= 0) {
      setError(t('errQuantity'));
      return;
    }

    if (quantityNum > Number(storage.available_space)) {
      setError(t('errQuantityMax', { v: Number(storage.available_space).toFixed(0) }));
      return;
    }

    setLoading(true);

    try {
      await createBookingWithTransaction(profile!.id, storage.id, quantityNum);
      setSuccess(true);
      setTimeout(() => onSuccess(), 1200);
    } catch (err: any) {
      setError(friendlyError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('bookStorage')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('bookingSuccess')}</h3>
            <p className="text-gray-600">{t('bookingSuccessMsg')}</p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-2">{storage.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{t('locationLabel', { v: storage.location })}</p>
                  <p>{t('availableLabel', { v: Number(storage.available_space).toFixed(0) })}</p>
                  <p>{t('priceLabel', { v: Number(storage.price_per_kg).toFixed(2) })}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('quantityToBook')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('maxKg', { v: Number(storage.available_space).toFixed(0) })}
                    max={Number(storage.available_space)}
                  />
                </div>

                {quantity && Number(quantity) > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t('totalCost')}</span>
                      <div className="flex items-center text-xl font-bold text-gray-900">
                        <span>₹{totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    {t('pendingNote')}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('booking') : t('confirmBooking')}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
