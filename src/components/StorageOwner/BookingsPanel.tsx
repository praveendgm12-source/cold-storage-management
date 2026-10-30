import React, { useState } from 'react';
import { Booking, StorageUnit, UserProfile } from '../../lib/supabase';
import { updateBookingStatus, getStorageUnitById, getUserProfile } from '../../lib/firebase';
import { Calendar, Package, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { friendlyError } from '../../lib/i18n';

interface BookingsPanelProps {
  bookings: Booking[];
  storageUnits: StorageUnit[];
  farmers: Map<string, UserProfile>;
  owners: Map<string, UserProfile>;
  onUpdate: () => void;
}

export const BookingsPanel: React.FC<BookingsPanelProps> = ({ bookings, storageUnits, farmers, owners, onUpdate }) => {
  const { t } = useTranslation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [storageCache, setStorageCache] = useState<Map<string, StorageUnit>>(() => {
    const m = new Map<string, StorageUnit>();
    storageUnits.forEach(s => m.set(s.id, s));
    return m;
  });
  const [localOwners, setLocalOwners] = useState<Map<string, UserProfile>>(() => new Map(owners));

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'rejected' | 'completed') => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      onUpdate();
    } catch (error: unknown) {
      alert(friendlyError(error, t));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStorageName = (storageId: string) => {
    return storageCache.get(storageId)?.name || (bookings.find(b => b.storage_id === storageId)?.storage_name) || t('unknownStorage');
  };

  const getStorageLocation = (storageId: string) => {
    return storageCache.get(storageId)?.location || (bookings.find(b => b.storage_id === storageId)?.storage_location) || '';
  };

  // keep cache in sync when parent storageUnits prop changes
  React.useEffect(() => {
    setStorageCache(prev => {
      const next = new Map(prev);
      storageUnits.forEach(s => next.set(s.id, s));
      return next;
    });
    // also merge owners prop into localOwners
    setLocalOwners(prev => {
      const next = new Map(prev);
      owners.forEach((v, k) => next.set(k, v));
      return next;
    });
  }, [storageUnits, owners]);

  // Prefetch any missing storage units referenced by bookings
  React.useEffect(() => {
    const missing = bookings
      .map(b => b.storage_id)
      .filter(id => !!id && !storageCache.has(id));
    if (missing.length === 0) return;

    let mounted = true;
    (async () => {
      for (const id of missing) {
        try {
          const s = await getStorageUnitById(id);
          if (s && mounted) {
            setStorageCache(prev => new Map(prev).set(id, s as StorageUnit));
            // also ensure owner profile exists locally
            const ownerId = (s as StorageUnit).owner_id as string | undefined;
            if (ownerId && !localOwners.has(ownerId)) {
              const p = await getUserProfile(ownerId);
              if (p && mounted) setLocalOwners(prev => new Map(prev).set(ownerId, p as UserProfile));
            }
          }
        } catch (err) {
          // ignore individual fetch errors
          console.error('Failed to fetch storage unit', id, err);
        }
      }
    })();
    return () => { mounted = false; };
  }, [bookings, storageCache, localOwners]);

  const getFarmerName = (farmerId: string) => {
    return farmers.get(farmerId)?.name || t('unknownFarmer');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {t(`status_${status}`)}
      </span>
    );
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noBookings')}</h3>
        <p className="text-gray-600">{t('ownerBookingsEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('farmerCol')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('storageUnit')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('quantity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {getFarmerName(booking.farmer_id)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">{getStorageName(booking.storage_id)}</div>
                      <div className="text-xs text-gray-500">
                        {getStorageLocation(booking.storage_id)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {Number(booking.quantity).toFixed(0)} kg
                  </span>
                  {booking.total_cost != null && (
                    <div className="text-xs text-gray-500">₹{Number(booking.total_cost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(booking.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {booking.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                        disabled={updatingId === booking.id}
                        className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                      >
                        {t('approve')}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                        disabled={updatingId === booking.id}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        {t('reject')}
                      </button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                      disabled={updatingId === booking.id}
                      className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                    >
                      {t('markCompleted')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
