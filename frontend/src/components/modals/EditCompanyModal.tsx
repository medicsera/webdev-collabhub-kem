import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import type { CompanyProfile } from '../../types';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  onSave: (updatedCompany: CompanyProfile) => void;
}

export const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onSave,
}) => {
  const [name, setName] = useState(company.name);
  const [department, setDepartment] = useState(company.department);
  const [industry, setIndustry] = useState(company.industry);
  const [city, setCity] = useState(company.city);
  const [address, setAddress] = useState(company.address);
  const [website, setWebsite] = useState(company.website);
  const [contactPerson, setContactPerson] = useState(company.contactPerson);
  const [contactRole, setContactRole] = useState(company.contactRole);
  const [contactTelegram, setContactTelegram] = useState(company.contactTelegram);
  const [contactEmail, setContactEmail] = useState(company.contactEmail);
  const [description, setDescription] = useState(company.description);
  const [benefitsInput, setBenefitsInput] = useState(company.benefits.join('\n'));

  useEffect(() => {
    if (isOpen) {
      setName(company.name);
      setDepartment(company.department);
      setIndustry(company.industry);
      setCity(company.city);
      setAddress(company.address);
      setWebsite(company.website);
      setContactPerson(company.contactPerson);
      setContactRole(company.contactRole);
      setContactTelegram(company.contactTelegram);
      setContactEmail(company.contactEmail);
      setDescription(company.description);
      setBenefitsInput(company.benefits.join('\n'));
    }
  }, [isOpen, company]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const benefits = benefitsInput
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    onSave({
      ...company,
      name: name.trim() || company.name,
      department: department.trim() || company.department,
      industry: industry.trim() || company.industry,
      city: city.trim() || company.city,
      address: address.trim() || company.address,
      website: website.trim() || company.website,
      contactPerson: contactPerson.trim() || company.contactPerson,
      contactRole: contactRole.trim() || company.contactRole,
      contactTelegram: contactTelegram.trim() || company.contactTelegram,
      contactEmail: contactEmail.trim() || company.contactEmail,
      description: description.trim() || company.description,
      benefits: benefits.length > 0 ? benefits : company.benefits,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-paper-card dark:bg-paper-darkCard border-2 border-ink dark:border-stone-600 max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl fade-in my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-paper-border dark:border-paper-darkBorder pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-oxblood dark:text-oxblood-light flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Карточка работодателя
            </div>
            <h3 className="text-2xl font-semibold text-ink dark:text-ink-light">
              Редактирование профиля компании
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="comp-name-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Название компании
              </label>
              <input
                id="comp-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="comp-dept-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Подразделение / Департамент
              </label>
              <input
                id="comp-dept-input"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="comp-ind-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Отрасль / Сфера деятельности
              </label>
              <input
                id="comp-ind-input"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="comp-web-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Веб-сайт
              </label>
              <input
                id="comp-web-input"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="comp-city-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Город
              </label>
              <input
                id="comp-city-input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="comp-addr-input"
                className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
              >
                Адрес офиса / Технопарк
              </label>
              <input
                id="comp-addr-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-3 border border-paper-border dark:border-paper-darkBorder bg-paper-light/50 dark:bg-paper-dark/60 space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400">
              Контакты представителя (HR / Ментор):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="ФИО контактного лица"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-xs font-mono text-ink dark:text-ink-light"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Должность"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-xs font-mono text-ink dark:text-ink-light"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Telegram (@username)"
                  value={contactTelegram}
                  onChange={(e) => setContactTelegram(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-xs font-mono text-oxblood dark:text-oxblood-light"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder text-xs font-mono text-ink dark:text-ink-light"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="comp-desc-input"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              О компании и направлениях стажировки
            </label>
            <textarea
              id="comp-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light leading-relaxed min-h-[60px] max-h-[140px] resize-y text-xs"
            />
          </div>

          <div>
            <label
              htmlFor="comp-benefits-input"
              className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted dark:text-stone-400 mb-1"
            >
              Условия для студентов (по одному на строке)
            </label>
            <textarea
              id="comp-benefits-input"
              rows={3}
              value={benefitsInput}
              onChange={(e) => setBenefitsInput(e.target.value)}
              placeholder="Официальное оформление&#10;Senior-наставник&#10;Оффер по результатам практики"
              className="w-full p-3 bg-paper-light dark:bg-paper-dark border border-paper-border dark:border-paper-darkBorder focus:outline-none text-ink dark:text-ink-light leading-relaxed min-h-[60px] max-h-[120px] resize-y text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-paper-border dark:border-paper-darkBorder">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-oxblood hover:bg-oxblood-hover text-white transition cursor-pointer shadow-xs"
            >
              Сохранить информацию
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
