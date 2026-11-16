import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditStudentProfileModal } from '../components/modals/EditStudentProfileModal';
import type { StudentProfile } from '../types';

export const EditStudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { studentProfile, updateStudentProfile } = useApp();

  const handleSave = (updated: StudentProfile) => {
    updateStudentProfile(updated);
    navigate('/profile');
  };

  const handleBack = () => {
    navigate('/profile');
  };

  return (
    <div className="space-y-6">
      <div className="double-rule-b pb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Назад в профиль
        </button>
        <span className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light font-semibold">
          Редактирование профиля студента
        </span>
      </div>

      <EditStudentProfileModal
        isOpen={true}
        isPage={true}
        profile={studentProfile}
        onClose={handleBack}
        onSave={handleSave}
      />
    </div>
  );
};
