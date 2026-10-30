import React, { useState } from 'react';
import { StorageUnit } from '../../lib/supabase';
import { uploadStorageImage, updateStorageUnit } from '../../lib/firebase';
import { X, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { friendlyError } from '../../lib/i18n';

interface EditStorageModalProps {
  storage: StorageUnit;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStorageModal: React.FC<EditStorageModalProps> = ({ storage, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: storage.name,
    location: storage.location,
    district: storage.district || '',
    itemType: storage.item_type || 'multipurpose',
    capacity: storage.capacity.toString(),
    availableSpace: storage.available_space.toString(),
    pricePerKg: storage.price_per_kg.toString(),
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(storage.image_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('errImageSize'));
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    return await uploadStorageImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const capacity = Number(formData.capacity);
    const availableSpace = Number(formData.availableSpace);
    const pricePerKg = Number(formData.pricePerKg);

    if (!formData.name || !formData.location || !formData.capacity || !formData.availableSpace || !formData.pricePerKg) {
      setError(t('errAllFields'));
      return;
    }

    if (capacity <= 0 || availableSpace < 0 || pricePerKg <= 0) {
      setError(t('errPositive'));
      return;
    }

    if (availableSpace > capacity) {
      setError(t('errSpaceCap'));
      return;
    }

    setLoading(true);

    try {
      let imageUrl = storage.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await updateStorageUnit(storage.id, {
        name: formData.name,
        location: formData.location,
        district: formData.district.trim() || null,
        item_type: formData.itemType,
        capacity,
        available_space: availableSpace,
        price_per_kg: pricePerKg,
        image_url: imageUrl || null,
      });

      onSuccess();
    } catch (err: any) {
      setError(friendlyError(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('editStorage')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('storageName')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('locationReq')}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('district')}</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Vellore"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('storageType')}</label>
              <select
                value={formData.itemType}
                onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="multipurpose">{t('type_multipurpose')}</option>
                <option value="fruits and vegetables">{t('type_fruits and vegetables')}</option>
                <option value="potato and onion">{t('type_potato and onion')}</option>
                <option value="milk products">{t('type_milk products')}</option>
                <option value="spices and dry fruits">{t('type_spices and dry fruits')}</option>
                <option value="marine products">{t('type_marine products')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('totalCapacityKg')}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('availableSpaceKg')}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.availableSpace}
                onChange={(e) => setFormData({ ...formData, availableSpace: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('pricePerKg')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.pricePerKg}
              onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('storageImage')}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{t('uploadImage')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('max5mb')}</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
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
              {loading ? t('updating') : t('update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
