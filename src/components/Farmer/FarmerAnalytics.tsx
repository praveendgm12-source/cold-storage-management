import React from 'react';
import { Booking } from '../../lib/supabase';
import { Package, TrendingUp, Clock, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FarmerAnalyticsProps {
  bookings: Booking[];
}

export const FarmerAnalytics: React.FC<FarmerAnalyticsProps> = ({ bookings }) => {
  const { t } = useTranslation();
  const totalBookings = bookings.length;
  const totalStored = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + Number(b.quantity), 0);
  const activeBookings = bookings.filter(
    b => b.status === 'pending' || b.status === 'confirmed'
  ).length;

  const totalSpent = bookings.reduce((sum, b) => (b.status === 'confirmed' || b.status === 'completed') ? sum + Number(b.total_cost ?? Number(b.quantity) * Number(b.price_per_kg || 0)) : sum, 0);

  const cards = [
    {
      title: t('totalBookings'),
      value: totalBookings,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('totalStored'),
      value: `${totalStored.toFixed(0)} kg`,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: t('activeBookings'),
      value: activeBookings,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: t('totalSpent'),
      value: `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: IndianRupee,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
