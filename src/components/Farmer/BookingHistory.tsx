import React from 'react';
import { Booking, StorageUnit } from '../../lib/supabase';
import { getStorageUnitById, cancelBookingByFarmer } from '../../lib/firebase';
import { savePdf } from '../../lib/download';
import { friendlyError } from '../../lib/i18n';
import { Calendar, Package, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';

interface BookingHistoryProps {
  bookings: Booking[];
  storageUnits: StorageUnit[];
}

export const BookingHistory: React.FC<BookingHistoryProps> = ({ bookings, storageUnits }) => {
  const { t } = useTranslation();
  const [loadingIds, setLoadingIds] = React.useState<Set<string>>(new Set());
  const getStorageName = (storageId: string) => {
    return storageUnits.find(s => s.id === storageId)?.name || (bookings.find((b: any) => b.storage_id === storageId) as any)?.storage_name || t('unknownStorage');
  };

  const getStorageLocation = (storageId: string) => {
    return storageUnits.find(s => s.id === storageId)?.location || (bookings.find((b: any) => b.storage_id === storageId) as any)?.storage_location || '';
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
        <p className="text-gray-600">{t('bookingHistoryEmpty')}</p>
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
                {t('storageUnit')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('location')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('quantity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('amount')}
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
                    <Package className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {getStorageName(booking.storage_id)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {getStorageLocation(booking.storage_id)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {Number(booking.quantity).toFixed(0)} kg
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{Number((booking as any).total_cost ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.status === 'confirmed' ? (
                    <button
                      onClick={async () => {
                        // allow generating receipt even if storage unit isn't present in the currently-passed list
                        try {
                          setLoadingIds(prev => new Set(prev).add(booking.id));
                          let storageName = getStorageName(booking.storage_id);
                          let storageLoc = getStorageLocation(booking.storage_id);
                          if (storageName === t('unknownStorage')) {
                            const s = await getStorageUnitById(booking.storage_id);
                            if (s) {
                              const sTyped = s as { name?: string; location?: string };
                              storageName = sTyped.name || storageName;
                              storageLoc = sTyped.location || storageLoc;
                            }
                          }

                          const doc = new jsPDF();
                          const b = booking as any;
                          doc.setFontSize(16);
                          doc.text('Coolza Booking Receipt', 14, 22);
                          doc.setFontSize(11);
                          doc.text(`Booking ID: ${booking.id}`, 14, 36);
                          doc.text(`Storage: ${storageName}`, 14, 46);
                          doc.text(`Location: ${storageLoc}`, 14, 56);
                          doc.text(`Quantity: ${booking.quantity} kg`, 14, 66);
                          doc.text(`Price: Rs ${Number(b.price_per_kg ?? 0).toFixed(2)} per kg`, 14, 76);
                          doc.text(`Total: Rs ${Number(b.total_cost ?? 0).toFixed(2)}`, 14, 86);
                          doc.text(`Status: ${booking.status}`, 14, 96);
                          doc.text(`Date: ${new Date(booking.created_at).toLocaleString('en-IN')}`, 14, 106);
                          const saved = savePdf(doc, `coolza-booking-${booking.id}.pdf`);
                          if (saved) alert(saved);
                        } catch (err) {
                          console.error('Error generating receipt', err);
                        } finally {
                          setLoadingIds(prev => {
                            const copy = new Set(prev);
                            copy.delete(booking.id);
                            return copy;
                          });
                        }
                      }}
                      disabled={loadingIds.has(booking.id)}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {loadingIds.has(booking.id) ? t('generating') : t('downloadReceipt')}
                    </button>
                  ) : booking.status === 'pending' ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 italic">{t('notApproved')}</span>
                      <button
                        onClick={async () => {
                          if (!window.confirm(t('confirmCancel'))) return;
                          try { await cancelBookingByFarmer(booking.id); } catch (e) { alert(friendlyError(e, t)); }
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        {t('cancelBooking')}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
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
