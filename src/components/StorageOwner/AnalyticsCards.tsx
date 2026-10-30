import React from 'react';
import { StorageUnit, Booking } from '../../lib/supabase';
import { Package, Database, TrendingUp, ShoppingCart, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnalyticsCardsProps {
  storageUnits: StorageUnit[];
  bookings: Booking[];
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ storageUnits, bookings }) => {
  const { t } = useTranslation();
  const totalUnits = storageUnits.length;
  const totalCapacity = storageUnits.reduce((sum, unit) => sum + Number(unit.capacity), 0);
  const totalAvailable = storageUnits.reduce((sum, unit) => sum + Number(unit.available_space), 0);
  const totalBooked = totalCapacity - totalAvailable;
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

  // Income calculation: sum(quantity * price_per_kg) for confirmed/completed bookings
  const income = bookings.reduce((sum, b) => {
    if (b.status !== 'confirmed' && b.status !== 'completed') return sum;
    if (b.total_cost != null) return sum + Number(b.total_cost);
    const unit = storageUnits.find(u => u.id === b.storage_id);
    const price = unit ? Number(unit.price_per_kg) : 0;
    return sum + price * Number(b.quantity);
  }, 0);

  const cards = [
    {
      title: t('storageUnits'),
      value: totalUnits,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('totalCapacity'),
      value: `${totalCapacity.toFixed(0)} kg`,
      icon: Database,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: t('bookedSpace'),
      value: `${totalBooked.toFixed(0)} kg`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: t('activeBookings'),
      value: activeBookings,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('income'),
      value: `₹${income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: IndianRupee,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
