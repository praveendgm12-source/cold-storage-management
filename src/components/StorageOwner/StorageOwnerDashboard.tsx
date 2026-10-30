import logoImg from '../../logo.jpg';
import React, { useEffect, useState } from 'react';
import { StorageUnit, Booking, UserProfile } from '../../lib/supabase';
import { getStorageUnitsByOwner, getBookingsForOwner, getUsersByIds, subscribeToOwnerStorage, subscribeToOwnerBookings } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../Common/NotificationBell';
import { LanguageSwitcher } from '../Common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Plus, LogOut } from 'lucide-react';
import { CreateStorageModal } from './CreateStorageModal';
import { StorageList } from './StorageList';
import { BookingsPanel } from './BookingsPanel';
import { AnalyticsCards } from './AnalyticsCards';

export const StorageOwnerDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [farmers, setFarmers] = useState<Map<string, UserProfile>>(new Map());
  const [owners, setOwners] = useState<Map<string, UserProfile>>(new Map());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadStorageUnits();
      loadBookings();
      // Live updates: refresh when storage units or bookings change in Firestore
      const unsubA = subscribeToOwnerStorage(profile.id, () => { loadStorageUnits(); });
      const unsubB = subscribeToOwnerBookings(profile.id, () => { loadBookings(); });
      return () => { unsubA(); unsubB(); };
    }
  }, [profile?.id]);

  const loadStorageUnits = async () => {
    try {
      const data = await getStorageUnitsByOwner(profile!.id);
      setStorageUnits(data as StorageUnit[]);
      // load owner profiles for these storage units (could be same as profile)
      const ownerIds = [...new Set((data as StorageUnit[]).map((s) => s.owner_id))] as string[];
      if (ownerIds.length > 0) {
        const ownersData = await getUsersByIds(ownerIds);
        if (ownersData) {
          const ownersArr = ownersData as Array<UserProfile>;
          const ownersMap = new Map<string, UserProfile>(ownersArr.map((o) => [o.id, o]));
          setOwners(ownersMap as Map<string, UserProfile>);
        }
      }
    } catch (error) {
      console.error('Error loading storage units:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const bookingsData = await getBookingsForOwner(profile!.id);
      setBookings(bookingsData as Booking[]);

      const farmerIds = [...new Set((bookingsData as Booking[]).map((b) => b.farmer_id))];
      if (farmerIds.length > 0) {
        const farmersData = await getUsersByIds(farmerIds as string[]);
        if (farmersData) {
          const farmersArr = farmersData as Array<UserProfile>;
          const farmersMap = new Map<string, UserProfile>(farmersArr.map((f) => [f.id, f]));
          setFarmers(farmersMap as Map<string, UserProfile>);
        }
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  // Subscriptions moved to Firestore helpers if needed (not wired here)

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
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{t('ownerDashboard')}</h1>
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
        <AnalyticsCards storageUnits={storageUnits} bookings={bookings} />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('myStorage')}</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>{t('addStorage')}</span>
            </button>
          </div>

          <StorageList
            storageUnits={storageUnits}
            onUpdate={loadStorageUnits}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('bookings')}</h2>
          <BookingsPanel
            bookings={bookings}
            storageUnits={storageUnits}
            farmers={farmers}
            owners={owners}
            onUpdate={loadBookings}
          />
        </div>
      </main>

      {showCreateModal && (
        <CreateStorageModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadStorageUnits();
          }}
        />
      )}
    </div>
  );
};
