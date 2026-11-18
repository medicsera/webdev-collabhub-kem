import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PublicStudentProfileTab } from '../components/tabs/PublicStudentProfileTab';
import { getStudentProfileApi } from '../api';
import type { StudentProfile } from '../types';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRole } = useApp();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const studentId = id ? parseInt(id, 10) : NaN;
    if (isNaN(studentId)) {
      setError('Некорректный идентификатор студента');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getStudentProfileApi(studentId)
      .then((data) => {
        if (isMounted) {
          setStudent(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error)?.message || 'Профиль студента не найден');
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
      navigate(currentRole === 'hr' ? '/students' : '/catalog');
    }
  };

  return (
    <PublicStudentProfileTab
      student={student}
      isLoading={isLoading}
      error={error}
      onBack={handleBack}
    />
  );
};
