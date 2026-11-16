import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CreateProjectModal } from '../components/modals/CreateProjectModal';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { createProject, companyProfile } = useApp();

  const handleCreate = (data: Parameters<typeof createProject>[0]) => {
    createProject(data);
    // Next Best Action: автоматический редирект на список проектов с подсветкой
    navigate('/hr/dashboard?tab=projects');
  };

  const handleBack = () => {
    navigate('/hr/dashboard?tab=projects');
  };

  return (
    <div className="space-y-6">
      <div className="double-rule-b pb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Назад к проектам
        </button>
        <span className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light font-semibold">
          Публикация задачи • {companyProfile.name}
        </span>
      </div>

      <CreateProjectModal
        isOpen={true}
        isPage={true}
        onClose={handleBack}
        onCreate={handleCreate}
        initialCompany={companyProfile.name}
        initialDepartment={companyProfile.department}
      />
    </div>
  );
};
