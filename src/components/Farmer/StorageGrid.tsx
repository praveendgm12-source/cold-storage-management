import React, { useMemo, useState } from 'react';
import { StorageUnit, UserProfile } from '../../lib/supabase';
import { MapPin, Package, IndianRupee, User, Search, Snowflake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookingModal } from './BookingModal';

interface StorageGridProps {
  storageUnits: StorageUnit[];
  storageOwners: Map<string, UserProfile>;
  onBookingSuccess: () => void;
}

export const StorageGrid: React.FC<StorageGridProps> = ({ storageUnits, storageOwners, onBookingSuccess }) => {
  const [selectedStorage, setSelectedStorage] = useState<StorageUnit | null>(null);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [maxPrice, setMaxPrice] = useState('');

  const districts = useMemo(() => {
    const set = new Set<string>();
    storageUnits.forEach((u) => u.district && set.add(u.district));
    return Array.from(set).sort();
  }, [storageUnits]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = storageUnits.filter((u) => {
      const text = `${u.name} ${u.location} ${u.district || ''} ${u.address || ''} ${u.item_type || ''}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (district !== 'all' && u.district !== district) return false;
      if (maxPrice && Number(u.price_per_kg) > Number(maxPrice)) return false;
      return true;
    });
    list = [...list];
    if (sortBy === 'priceAsc') list.sort((a, b) => Number(a.price_per_kg) - Number(b.price_per_kg));
    if (sortBy === 'priceDesc') list.sort((a, b) => Number(b.price_per_kg) - Number(a.price_per_kg));
    if (sortBy === 'space') list.sort((a, b) => Number(b.available_space) - Number(a.available_space));
    return list;
  }, [storageUnits, search, district, sortBy, maxPrice]);

  if (storageUnits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noStorage')}</h3>
        <p className="text-gray-600">{t('checkBack')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="all">{t('allDistricts')}</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg">
            <option value="recent">{t('sortNewest')}</option>
            <option value="priceAsc">{t('sortPriceAsc')}</option>
            <option value="priceDesc">{t('sortPriceDesc')}</option>
            <option value="space">{t('sortSpace')}</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={t('maxPrice')}
            className="w-24 px-2 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">{t('countOf', { shown: filtered.length, total: storageUnits.length })}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((unit) => {
          const owner = storageOwners.get(unit.owner_id);
          const utilizationPercent = ((Number(unit.capacity) - Number(unit.available_space)) / Number(unit.capacity)) * 100;

          return (
            <div
              key={unit.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedStorage(unit)}
            >
              {unit.image_url && (
                <img
                  src={unit.image_url}
                  alt={unit.name}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{unit.name}</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{unit.location}{unit.district && !unit.location.includes(unit.district) ? `, ${unit.district}` : ''}</span>
                  </div>
                  {unit.item_type && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Snowflake className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{t(`type_${unit.item_type}`, { defaultValue: unit.item_type })}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2 flex-shrink-0" />
                    {t('kgAvailable', { kg: Number(unit.available_space).toFixed(0) })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <IndianRupee className="w-4 h-4 mr-2 flex-shrink-0" />
                    {t('perKg', { price: Number(unit.price_per_kg).toFixed(2) })}
                  </div>
                  {owner && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 flex-shrink-0" />
                      {owner.name}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('capacityUsed')}</span>
                    <span className="font-medium text-gray-900">{utilizationPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                  {t('bookNow')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedStorage && (
        <BookingModal
          storage={selectedStorage}
          onClose={() => setSelectedStorage(null)}
          onSuccess={() => {
            setSelectedStorage(null);
            onBookingSuccess();
          }}
        />
      )}
    </>
  );
};
