import React, { useState } from 'react';
import { StorageUnit } from '../../lib/supabase';
import { deleteStorageUnit } from '../../lib/firebase';
import { MapPin, Package, IndianRupee, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EditStorageModal } from './EditStorageModal';

interface StorageListProps {
  storageUnits: StorageUnit[];
  onUpdate: () => void;
}

export const StorageList: React.FC<StorageListProps> = ({ storageUnits, onUpdate }) => {
  const [editingUnit, setEditingUnit] = useState<StorageUnit | null>(null);
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteStorageUnit(id);
      onUpdate();
    } catch (error: any) {
      alert(error.message || t('errGeneric'));
    } finally {
      setDeletingId(null);
    }
  };

  if (storageUnits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noStorageYet')}</h3>
        <p className="text-gray-600">{t('createFirst')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storageUnits.map((unit) => {
          const utilizationPercent = ((Number(unit.capacity) - Number(unit.available_space)) / Number(unit.capacity)) * 100;

          return (
            <div key={unit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
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
                    <MapPin className="w-4 h-4 mr-2" />
                    {unit.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    {t('kgOfAvailable', { avail: Number(unit.available_space).toFixed(0), cap: Number(unit.capacity).toFixed(0) })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <IndianRupee className="w-4 h-4 mr-2" />
                    {t('perKg', { price: Number(unit.price_per_kg).toFixed(2) })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('utilization')}</span>
                    <span className="font-medium text-gray-900">{utilizationPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingUnit(unit)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{t('edit')}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    disabled={deletingId === unit.id}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deletingId === unit.id ? t('deleting') : t('delete')}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingUnit && (
        <EditStorageModal
          storage={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSuccess={() => {
            setEditingUnit(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
};
