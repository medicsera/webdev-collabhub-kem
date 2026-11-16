import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PublicCompanyProfileTab } from '../components/tabs/PublicCompanyProfileTab';
import { getCompanyProfileApi } from '../api';
import type { CompanyProfile, Project } from '../types';

export const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, setSelectedProjectForModal, currentRole } = useApp();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const companyId = id ? parseInt(id, 10) : NaN;
    if (isNaN(companyId)) {
      setError('Некорректный идентификатор компании');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getCompanyProfileApi(companyId)
      .then((data) => {
        if (isMounted) {
          setCompany(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error)?.message || 'Компания не найдена');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(currentRole === 'student' ? '/catalog' : '/hr/dashboard');
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProjectForModal(project);
  };

  return (
    <PublicCompanyProfileTab
      company={company}
      projects={projects}
      isLoading={isLoading}
      error={error}
      onBack={handleBack}
      onSelectProject={handleSelectProject}
    />
  );
};
