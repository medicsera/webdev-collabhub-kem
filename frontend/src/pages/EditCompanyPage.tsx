import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const EditCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsEditCompanyModalOpen } = useApp();

  useEffect(() => {
    setIsEditCompanyModalOpen(true);
    navigate('/company/profile', { replace: true });
  }, [navigate, setIsEditCompanyModalOpen]);

  return null;
};
