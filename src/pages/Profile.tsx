import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../components/Layout/UserLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, Save, Trash2, User, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Profile = () => {
  const { user, profile, setProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile, user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image doit faire moins de 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile!, avatar_url: publicUrl });
      alert('Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile!, ...formData });
      alert('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE' || !user) {
      alert('Veuillez taper DELETE pour confirmer');
      return;
    }

    setLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        alert('Compte supprimé avec succès');
        navigate('/');
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      alert('Compte supprimé avec succès');
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression du compte. Veuillez contacter le support.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('profile.title')}</h1>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <button
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-slate-600 text-center">
                {uploading ? t('profile.uploading') : t('profile.clickToChange')}
              </p>
              <p className="text-xs text-slate-500">{t('profile.maxSize')}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  {t('profile.fullName')}
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">{t('profile.emailNote')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t('profile.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {t('profile.address')}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="123 Rue Example, Ville, Pays"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? t('common.save') + '...' : t('profile.saveChanges')}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">{t('profile.dangerZone')}</h2>
              <p className="text-red-700 mb-4">
                {t('profile.deleteWarning')}
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>{t('profile.deleteAccount')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t('profile.deleteConfirmTitle')}</h3>
            </div>

            <p className="text-slate-700 mb-4">
              {t('profile.deleteConfirmText')}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">
                {t('profile.typeDELETE')}
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmation !== 'DELETE'}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('profile.deletingAccount') : t('dashboard.deletePermanently')}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};
