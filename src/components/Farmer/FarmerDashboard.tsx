import logoImg from '../../logo.jpg';
import React, { useEffect, useState } from 'react';
import { StorageUnit, Booking, UserProfile } from '../../lib/supabase';
import { getAvailableStorage, getUsersByIds, getBookingsForFarmer, subscribeToAvailableStorage, subscribeToBookingsForFarmer } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../Common/NotificationBell';
import { LanguageSwitcher } from '../Common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { StorageGrid } from './StorageGrid';
import { BookingHistory } from './BookingHistory';
import { FarmerAnalytics } from './FarmerAnalytics';

export const FarmerDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [availableStorage, setAvailableStorage] = useState<StorageUnit[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [storageOwners, setStorageOwners] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadAvailableStorage();
      loadMyBookings();
  const unsub1 = subscribeToAvailableStorage(async (data) => {
        setAvailableStorage(data as unknown as StorageUnit[]);
        const ids = [...new Set(data.map((s: any) => s.owner_id).filter(Boolean))] as string[];
        if (ids.length) {
          const owners = await getUsersByIds(ids);
          setStorageOwners(new Map((owners as any[]).map((o: any) => [o.id, o])) as Map<string, UserProfile>);
        }
      });
  const unsub2 = subscribeToBookingsForFarmer(profile.id, (data) => setMyBookings(data as unknown as Booking[]));
      return () => { unsub1(); unsub2(); };
    }
  }, [profile?.id]);

  const loadAvailableStorage = async () => {
    try {
      const storageData = await getAvailableStorage();
      setAvailableStorage(storageData as StorageUnit[]);

  const ownerIds = [...new Set((storageData as any).map((s: any) => s.owner_id))] as string[];
      if (ownerIds.length > 0) {
        const ownersData = await getUsersByIds(ownerIds);
        if (ownersData) {
          const ownersMap = new Map((ownersData as any).map((o: any) => [o.id, o]));
          setStorageOwners(ownersMap as Map<string, UserProfile>);
        }
      }
    } catch (error) {
      console.error('Error loading storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const bookings = await getBookingsForFarmer(profile!.id);
      setMyBookings(bookings as Booking[]);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={logoImg}
                alt="Coolza"
                className="h-10 sm:h-12"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{t('farmerDashboard')}</h1>
                <p className="text-sm text-gray-600">{t('welcomeBack', { name: profile?.name })}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSwitcher compact />
              <NotificationBell />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FarmerAnalytics bookings={myBookings} />

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('availableStorage')}</h2>
          <StorageGrid
            storageUnits={availableStorage}
            storageOwners={storageOwners}
            onBookingSuccess={() => {
              loadAvailableStorage();
              loadMyBookings();
            }}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('myBookings')}</h2>
          <BookingHistory
            bookings={myBookings}
            storageUnits={availableStorage}
          />
        </div>
      </main>
    </div>
  );
};
