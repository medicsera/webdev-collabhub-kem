import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import type { Project } from '../types';

export const EditProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject } = useApp();

  const projectId = id ? parseInt(id, 10) : NaN;
  const project = projects.find((p) => p.id === projectId) || null;

  const handleUpdate = (updated: Project) => {
    updateProject(updated);
    navigate('/hr/dashboard?tab=projects');
  };

  const handleDelete = (projId: number) => {
    deleteProject(projId);
    navigate('/hr/dashboard?tab=projects');
  };

  const handleBack = () => {
    navigate('/hr/dashboard?tab=projects');
  };

  if (!project) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-paper-border dark:border-paper-darkBorder hover:border-ink dark:hover:border-stone-400 text-ink dark:text-ink-light transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Назад к проектам
        </button>
        <div className="p-12 text-center border border-paper-border dark:border-paper-darkBorder bg-paper-card dark:bg-paper-darkCard space-y-4">
          <AlertCircle className="w-8 h-8 text-oxblood dark:text-oxblood-light mx-auto" />
          <p className="editorial-serif italic text-2xl text-ink-muted dark:text-stone-400">
            Проект #{id} не найден
          </p>
        </div>
      </div>
    );
  }

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
          Редактирование • {project.index}
        </span>
      </div>

      <EditProjectModal
        project={project}
        isOpen={true}
        isPage={true}
        onClose={handleBack}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
};
