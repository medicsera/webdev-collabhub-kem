import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const EditStudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsEditStudentProfileModalOpen } = useApp();

  useEffect(() => {
    setIsEditStudentProfileModalOpen(true);
    navigate('/profile', { replace: true });
  }, [navigate, setIsEditStudentProfileModalOpen]);

  return null;
};
