import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import { eq } from 'drizzle-orm';

// Импортируем подключение к БД и схему
import { db } from './db/index.js';
import { organizations, projects, students, studentSkills, skills, projectSkills } from './db/schema.js';
import applicationRoutes from "./controllers/application.routes.js";
import { aiService, formatAiFeedback } from "./services/aiService.js";

dotenv.config()

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/api/application', applicationRoutes);

// Резервные публичные данные компаний (fallback при отсутствии живой БД в dev-окружении)
const FALLBACK_COMPANIES = [
  {
    id: 1,
    name: 'Софт Инжиниринг',
    department: 'Департамент веб-разработки и системной интеграции',
    industry: 'Заказная веб-разработка, AI-ассистенты, Финтех',
    city: 'г. Кемерово',
    address: 'ул. Весенняя, д. 24, технопарк Кузбасса',
    website: 'https://soft-engineering.ru',
    contactPerson: 'Валерия Краснова',
    contactRole: 'Lead Tech Recruiter / Руководитель производственной практики',
    contactTelegram: '@valeria_hr_kem',
    contactEmail: 'practice@soft-engineering.ru',
    description:
      'Ведущая технологическая компания региона с 12-летним опытом разработки корпоративных информационных систем. Мы активно привлекаем студентов профильных направлений КемГУ для участия в реальных коммерческих проектах и создания выпускных квалификационных работ.',
    benefits: [
      'Официальное оформление производственной практики и тем ВКР',
      'Персональный Senior-наставник для каждой студенческой команды',
      'Возможность оффера на позицию Junior+ по результатам защиты',
      'Стек: React 19, TypeScript, Node.js, FastAPI, PostgreSQL, pgvector',
      'Гибкий график и возможность удалённой или гибридной работы',
    ],
  },
  {
    id: 2,
    name: 'Goodline',
    department: 'Отдел цифровых продуктов связи',
    industry: 'Телекоммуникации, Интернет-провайдинг, IoT',
    city: 'г. Кемерово',
    address: 'пр. Кузнецкий, д. 33, бизнес-центр «Связь»',
    website: 'https://goodline.info',
    contactPerson: 'Алексей Дмитриев',
    contactRole: 'Технический директор / Куратор стажировок',
    contactTelegram: '@alexey_goodline',
    contactEmail: 'internship@goodline.info',
    description:
      'Крупнейший интернет-провайдер Кузбасса с собственной оптоволоконной инфраструктурой. Разрабатываем цифровые продукты для абонентов, внутренние системы мониторинга и геоаналитики покрытия сети.',
    benefits: [
      'Работа с реальной продуктовой командой и продакшн-сервисами',
      'Доступ к большим данным телекоммуникаций для аналитических проектов',
      'Оплачиваемая стажировка с возможностью трудоустройства',
      'Стек: React, TypeScript, Node.js, REST API, PostgreSQL',
    ],
  },
  {
    id: 3,
    name: 'UniFun',
    department: 'Backend Architecture Lab',
    industry: 'Gamedev-инфраструктура, Телеком-платформы, Highload',
    city: 'г. Кемерово',
    address: 'ул. Тухачевского, д. 58а, офис 301',
    website: 'https://unifun.com',
    contactPerson: 'Максим Орлов',
    contactRole: 'Lead Backend Engineer / Ментор',
    contactTelegram: '@max_unifun',
    contactEmail: 'careers@unifun.com',
    description:
      'Международная компания, специализирующаяся на разработке высоконагруженных серверных решений для телекоммуникационных платформ и игровой индустрии. Кемеровский офис — центр бэкенд-разработки.',
    benefits: [
      'Участие в международных highload-проектах',
      'Менторство от Senior/Staff инженеров',
      'Глубокое погружение в системное программирование и архитектуру',
      'Стек: Node.js, PostgreSQL, Redis, Docker, Kubernetes',
    ],
  },
];

const FALLBACK_PROJECTS = [
  {
    id: 1,
    index: '№ 01',
    title: 'Интеллектуальная система классификации и маршрутизации обращений технической дирекции',
    company: 'Софт Инжиниринг',
    companyId: 1,
    department: 'Департамент веб-разработки',
    type: 'ВКР / Диплом',
    match: 96,
    teamSize: '2–3 студента',
    tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    desc: 'Разработка отказоустойчивого веб-модуля для автоматической маршрутизации инцидентов с интеграцией векторного семантического поиска на базе pgvector (MiniLM-L12-v2) и GigaChat.',
  },
  {
    id: 2,
    index: '№ 02',
    title: 'Личный кабинет абонента и картографическая система покрытия сети с геоаналитикой',
    company: 'Goodline',
    companyId: 2,
    department: 'Отдел цифровых продуктов связи',
    type: 'Стажировка',
    match: 92,
    teamSize: '1–2 студента',
    tags: ['React', 'Leaflet', 'REST API', 'PostgreSQL'],
    desc: 'Интерактивная карта покрытия широкополосного доступа в Кузбассе с визуализацией аварийных участков, тепловой картой качества связи и персональным ЛК абонента.',
  },
  {
    id: 3,
    index: '№ 03',
    title: 'Высоконагруженный микросервис сценарной логики для телеком-платформ',
    company: 'UniFun',
    companyId: 3,
    department: 'Backend Architecture Lab',
    type: 'Стажировка',
    match: 85,
    teamSize: '2 студента',
    tags: ['Node.js', 'Redis', 'PostgreSQL', 'Docker'],
    desc: 'Сервис исполнения сценариев абонентских запросов с требованиями SLA 99.95%, временем отклика < 45мс и обработкой до 5 000 RPS.',
  },
  {
    id: 4,
    index: '№ 04',
    title: 'Автоматизированный комплекс формирования академических отчетов по практике',
    company: 'Софт Инжиниринг',
    companyId: 1,
    department: 'Отдел интеграционных решений',
    type: 'Курсовой проект',
    match: 89,
    teamSize: '1 студент',
    tags: ['TypeScript', 'PDF Generation', 'Node.js', 'PostgreSQL'],
    desc: 'Генерация официальных индивидуальных заданий, календарных планов и дневников практики студентов Института цифры КемГУ в формате PDF/DOCX по ГОСТ.',
  },
];

// Резервные публичные профили студентов (без паролей и приватных данных)
const FALLBACK_STUDENTS = [
  {
    id: 1,
    name: 'Сергиенко Александр Сергеевич',
    group: 'ФИТ-231',
    year: 'IV Курс',
    university: 'КемГУ',
    specialization: 'Fullstack / Team Lead',
    telegram: '@SERK4S',
    city: 'Кемерово',
    status: 'Готов к практике',
    skills: [
      { name: 'React', level: 'ADVANCED' },
      { name: 'TypeScript', level: 'ADVANCED' },
      { name: 'Node.js', level: 'INTERMEDIATE' },
      { name: 'FastAPI', level: 'INTERMEDIATE' },
      { name: 'PostgreSQL', level: 'ADVANCED' },
      { name: 'Docker', level: 'INTERMEDIATE' },
    ],
    bio: 'Разрабатываю веб-приложения на React, TypeScript и Node.js. Есть опыт проектирования баз данных PostgreSQL, настройки Docker и управления командой.',
    aiMatch: 96,
    aiFeedback:
      'Ваш профиль показывает 96% семантический матч с требованиями ведущих проектов от компаний «Софт Инжиниринг» и «Goodline».',
  },
  {
    id: 2,
    name: 'Кононенко Егор Сергеевич',
    group: 'ФИТ-231',
    year: 'IV Курс',
    university: 'КемГУ',
    specialization: 'Backend Developer',
    telegram: '@egor_dev',
    city: 'Кемерово',
    status: 'Готов к практике',
    skills: [
      { name: 'JavaScript', level: 'ADVANCED' },
      { name: 'Node.js', level: 'INTERMEDIATE' },
      { name: 'PostgreSQL', level: 'BASIC' },
      { name: 'Docker', level: 'BASIC' },
    ],
    bio: 'Занимаюсь серверной разработкой на Node.js, изучаю архитектуру распределённых систем. Интересуюсь Docker-контейнеризацией и CI/CD.',
    aiMatch: 88,
    aiFeedback:
      'Профиль хорошо подходит для задач автоматизации и бэкенд-разработки.',
  },
  {
    id: 3,
    name: 'Мирко Антон Сергеевич',
    group: 'ФИТ-231',
    year: 'IV Курс',
    university: 'КемГУ',
    specialization: 'Frontend Engineer',
    telegram: '@anton_mirko',
    city: 'Кемерово',
    status: 'Ищет проект ВКР',
    skills: [
      { name: 'React', level: 'ADVANCED' },
      { name: 'TypeScript', level: 'ADVANCED' },
      { name: 'Tailwind CSS', level: 'ADVANCED' },
      { name: 'Next.js', level: 'INTERMEDIATE' },
      { name: 'Redux Toolkit', level: 'INTERMEDIATE' },
    ],
    bio: 'Специализируюсь на создании сложных пользовательских интерфейсов, дизайн-систем и анимаций. Опыт работы в кросс-функциональной студенческой команде.',
    aiMatch: 94,
    aiFeedback:
      'Высокая согласованность с проектами клиентских приложений и геоинформационных интерфейсов Goodline.',
  },
  {
    id: 4,
    name: 'Воронова Дарья Андреевна',
    group: 'ПИ-222',
    year: 'III Курс',
    university: 'КемГУ',
    specialization: 'Data Analyst / ML Engineer',
    telegram: '@daria_data',
    city: 'Кемерово',
    status: 'Готова к стажировке',
    skills: [
      { name: 'Python', level: 'ADVANCED' },
      { name: 'PostgreSQL', level: 'INTERMEDIATE' },
      { name: 'FastAPI', level: 'INTERMEDIATE' },
      { name: 'Docker', level: 'BASIC' },
      { name: 'Scikit-learn', level: 'INTERMEDIATE' },
    ],
    bio: 'Исследую методы обработки естественного языка и классификации текстов. Заинтересована в решении прикладных аналитических задач для телеком-сферы.',
    aiMatch: 91,
    aiFeedback:
      'Отличный матч для интеллектуальной классификации обращений техдирекции в «Софт Инжиниринг».',
  },
  {
    id: 5,
    name: 'Смирнов Максим Игоревич',
    group: 'ИБ-211',
    year: 'IV Курс',
    university: 'КемГУ',
    specialization: 'DevOps / SecOps',
    telegram: '@max_secops',
    city: 'Кемерово',
    status: 'Готов к практике',
    skills: [
      { name: 'Docker', level: 'ADVANCED' },
      { name: 'PostgreSQL', level: 'INTERMEDIATE' },
      { name: 'Node.js', level: 'BASIC' },
      { name: 'Python', level: 'INTERMEDIATE' },
      { name: 'FastAPI', level: 'BASIC' },
    ],
    bio: 'Занимаюсь настройкой сред развёртывания, автоматизацией CI/CD конвейеров, безопасностью сетевых сервисов и мониторингом инфраструктуры.',
    aiMatch: 86,
    aiFeedback:
      'Хороший фундамент системного администрирования для highload-инфраструктуры UniFun.',
  },
];

// Проверка здоровья
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CollabHub Backend API' });
});

// 1. Публичные данные компании по ID + список активных вакансий/проектов
app.get('/api/v1/companies/:id', async (req: Request, res: Response) => {
  const rawId = typeof req.params.id === 'string' ? req.params.id : '';
  const companyId = parseInt(rawId, 10);

  try {
    // Новая схема: организации идентифицируются по uuid
    const foundCompanies = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, rawId))
      .limit(1);

    if (foundCompanies.length > 0 && foundCompanies[0]) {
      const company = foundCompanies[0];
      const companyProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, company.id));

      return res.json({
        ...company,
        name: company.companyName,
        vacancies: companyProjects,
      });
    }
  } catch (err) {
    // В случае отсутствия активного соединения с Postgres — прозрачный переход к fallback-данным
    console.warn(`[DB notice] fallback to in-memory records for company ${rawId}`);
  }

  // Fallback поиск (числовые id из резервных данных)
  const fallbackCompany = isNaN(companyId)
    ? undefined
    : FALLBACK_COMPANIES.find((c) => c.id === companyId);
  if (!fallbackCompany) {
    return res.status(404).json({ error: 'Компания не найдена' });
  }

  const vacancies = FALLBACK_PROJECTS.filter((p) => p.companyId === companyId);

  return res.json({
    ...fallbackCompany,
    vacancies,
  });
});

// 2. Каталог всех студентов для работодателей
app.get('/api/v1/students', async (_req: Request, res: Response) => {
  try {
    const allStudents = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        universityGroup: students.universityGroup,
        year: students.year,
        university: students.university,
        specialization: students.specialization,
        telegram: students.telegram,
        city: students.city,
        status: students.status,
        bio: students.bio,
      })
      .from(students);

    if (allStudents.length > 0) {
      // Подтягиваем навыки для каждого студента
      const studentsWithSkills = await Promise.all(
        allStudents.map(async (st) => {
          const stSkills = await db
            .select({
              name: skills.name,
              level: studentSkills.proficiencyLevel,
            })
            .from(studentSkills)
            .innerJoin(skills, eq(studentSkills.skillId, skills.id))
            .where(eq(studentSkills.studentId, st.id));

          return {
            name: `${st.firstName} ${st.lastName}`.trim(),
            group: st.universityGroup,
            ...st,
            skills: stSkills,
            aiMatch: 90,
            aiFeedback: 'Высокое соответствие профиля студента проектным задачам.',
          };
        })
      );

      return res.json(studentsWithSkills);
    }
  } catch (err) {
    console.warn('[DB notice] fallback to in-memory students catalog');
  }

  return res.json(FALLBACK_STUDENTS);
});

// 3. Публичный профиль/резюме студента по ID (без конфиденциальных системных полей)
app.get('/api/v1/students/:id', async (req: Request, res: Response) => {
  const rawId = typeof req.params.id === 'string' ? req.params.id : '';
  const studentId = parseInt(rawId, 10);

  try {
    // Новая схема: студенты идентифицируются по uuid
    const foundStudents = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        universityGroup: students.universityGroup,
        year: students.year,
        university: students.university,
        specialization: students.specialization,
        telegram: students.telegram,
        city: students.city,
        status: students.status,
        bio: students.bio,
        aiMatchScore: students.aiMatchScore,
        aiFeedback: students.aiFeedback,
      })
      .from(students)
      .where(eq(students.id, rawId))
      .limit(1);

    if (foundStudents.length > 0 && foundStudents[0]) {
      const student = foundStudents[0];
      const studentSkillRecords = await db
        .select({
          name: skills.name,
          level: studentSkills.proficiencyLevel,
        })
        .from(studentSkills)
        .innerJoin(skills, eq(studentSkills.skillId, skills.id))
        .where(eq(studentSkills.studentId, student.id));

      return res.json({
        ...student,
        name: `${student.firstName} ${student.lastName}`.trim(),
        group: student.universityGroup,
        skills: studentSkillRecords,
        aiMatch: student.aiMatchScore ?? 90,
        aiFeedback: student.aiFeedback ?? 'Высокое соответствие профиля студента проектным задачам.',
      });
    }
  } catch (err) {
    console.warn(`[DB notice] fallback to in-memory records for student ${studentId}`);
  }

  // Fallback поиск
  const fallbackStudent = FALLBACK_STUDENTS.find((s) => s.id === studentId);
  if (!fallbackStudent) {
    return res.status(404).json({ error: 'Профиль студента не найден' });
  }

  // Безопасная проекция публичного резюме
  return res.json({
    id: fallbackStudent.id,
    name: fallbackStudent.name,
    group: fallbackStudent.group,
    year: fallbackStudent.year,
    university: fallbackStudent.university,
    specialization: fallbackStudent.specialization,
    telegram: fallbackStudent.telegram,
    city: fallbackStudent.city,
    status: fallbackStudent.status,
    skills: fallbackStudent.skills,
    bio: fallbackStudent.bio,
    aiMatch: fallbackStudent.aiMatch,
    aiFeedback: fallbackStudent.aiFeedback,
  });
});

// 3b. Обновление bio студента (PATCH /api/v1/students/:id)
app.patch('/api/v1/students/:id', async (req: Request, res: Response) => {
  const rawId = typeof req.params.id === 'string' ? req.params.id : '';
  const { bio } = req.body as { bio?: string };

  if (typeof bio !== 'string') {
    return res.status(400).json({ error: 'Ожидается строка bio' });
  }

  try {
    const [updated] = await db
      .update(students)
      .set({ bio, updatedAt: new Date() })
      .where(eq(students.id, rawId))
      .returning({
        id: students.id,
        bio: students.bio,
        firstName: students.firstName,
        lastName: students.lastName,
      });

    if (!updated) {
      return res.status(404).json({ error: 'Студент не найден' });
    }
    return res.json({
      id: updated.id,
      bio: updated.bio,
      name: `${updated.firstName} ${updated.lastName}`.trim(),
    });
  } catch (err) {
    console.warn('[DB notice] PATCH students failed:', err);
    return res.status(503).json({ error: 'БД недоступна, bio не сохранён' });
  }
});

// 3c. Пересчёт ИИ-рекомендаций профиля (POST /api/v1/students/:id/recalculate)
// Тело: { bio?, skills?: [{name, proficiency_level}] } — skills из body, если нет в БД (mock-id).
// Сохраняет bio при наличии UUID, гонит match + analyze + embed через ai-service.
app.post('/api/v1/students/:id/recalculate', async (req: Request, res: Response) => {
  const rawId = typeof req.params.id === 'string' ? req.params.id : '';
  const body = (req.body ?? {}) as {
    bio?: string;
    skills?: Array<{ name: string; proficiency_level?: string }>;
  };
  const nextBio = typeof body.bio === 'string' ? body.bio : undefined;
  const bodySkills = Array.isArray(body.skills) ? body.skills : [];

  let student: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
    bio: string | null;
  } | null = null;

  try {
    const found = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        specialization: students.specialization,
        bio: students.bio,
      })
      .from(students)
      .where(eq(students.id, rawId))
      .limit(1);
    student = found[0] ?? null;
  } catch {
    student = null;
  }

  // Навыки: приоритет — body (то, что видит пользователь), иначе БД.
  // Раньше БД перекрывала body: на UI FastAPI есть, в seed его нет → ложный missing.
  let skillRows: Array<{ name: string; level: string }> = [];
  if (bodySkills.length > 0) {
    skillRows = bodySkills.map((s) => ({
      name: s.name,
      level: (s.proficiency_level ?? 'INTERMEDIATE').toUpperCase(),
    }));
  } else if (student) {
    try {
      skillRows = await db
        .select({
          name: skills.name,
          level: studentSkills.proficiencyLevel,
        })
        .from(studentSkills)
        .innerJoin(skills, eq(studentSkills.skillId, skills.id))
        .where(eq(studentSkills.studentId, student.id));
    } catch {
      skillRows = [];
    }
  }

  const skillNames = skillRows.map((s) => s.name);
  if (skillNames.length === 0) {
    return res.status(400).json({ error: 'Нет навыков для анализа (БД или body.skills)' });
  }

  // Активные проекты с требованиями
  let activeProjects: Array<{ id: string; title: string; description: string }> = [];
  let projectSkillLists: string[][] = [];
  try {
    activeProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
      })
      .from(projects)
      .where(eq(projects.status, 'ACTIVE'));

    projectSkillLists = await Promise.all(
      activeProjects.map(async (p) => {
        const reqs = await db
          .select({ name: skills.name })
          .from(projectSkills)
          .innerJoin(skills, eq(projectSkills.skillId, skills.id))
          .where(eq(projectSkills.projectId, p.id));
        return reqs.map((r) => r.name);
      }),
    );
  } catch {
    activeProjects = [];
    projectSkillLists = [];
  }

  // Фолбэк-проекты, если БД пуста (dev / mock)
  if (activeProjects.length === 0) {
    activeProjects = FALLBACK_PROJECTS.map((p) => ({
      id: String(p.id),
      title: p.title,
      description: p.desc,
    }));
    projectSkillLists = FALLBACK_PROJECTS.map((p) => p.tags);
  }

  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < activeProjects.length; i++) {
    const reqs = projectSkillLists[i];
    if (!reqs?.length) continue;
    try {
      const score = await aiService.match(
        skillRows.map((s) => ({ name: s.name, proficiency_level: s.level })),
        reqs,
      );
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    } catch {
      /* skip project if AI fails */
    }
  }

  const bestProject = activeProjects[bestIdx];
  const bestReqs = projectSkillLists[bestIdx] ?? [];

  if (!bestProject || bestScore < 0) {
    return res.status(502).json({ error: 'AI-сервис недоступен, пересчёт невозможен' });
  }

  let feedbackText: string;
  let embedding: string | null = null;
  try {
    const analysis = await aiService.analyze(
      skillNames,
      bestProject.title,
      bestProject.description,
      bestReqs,
      {
        studentBio: nextBio ?? student?.bio ?? undefined,
        matchScore: bestScore,
      },
    );
    feedbackText = formatAiFeedback(analysis, bestProject.title, bestScore, skillNames);
    const profileText = [
      student ? `${student.firstName} ${student.lastName}` : '',
      student?.specialization ?? '',
      nextBio ?? student?.bio ?? '',
      skillNames.join(', '),
    ]
      .filter(Boolean)
      .join('. ');
    embedding = await aiService.embed(profileText);
  } catch (err) {
    console.warn('[AI notice] recalculate fallback:', err);
    feedbackText = `Ваш профиль показывает ${Math.round(bestScore)}% семантического соответствия с требованиями проекта «${bestProject.title}». Навыки: ${skillNames.join(', ')}.`;
  }

  // Персистим только при реальном UUID-студенте
  if (student) {
    try {
      await db
        .update(students)
        .set({
          ...(nextBio !== undefined ? { bio: nextBio } : {}),
          aiMatchScore: bestScore,
          aiFeedback: feedbackText,
          ...(embedding ? { embedding } : {}),
          updatedAt: new Date(),
        })
        .where(eq(students.id, student.id));
    } catch (err) {
      console.warn('[DB notice] recalculate persist failed:', err);
    }
  }

  return res.json({
    id: student?.id ?? rawId,
    bio: nextBio ?? student?.bio ?? null,
    aiMatch: bestScore,
    aiFeedback: feedbackText,
    bestProject: { id: bestProject.id, title: bestProject.title },
    embeddingSaved: Boolean(embedding),
    persisted: Boolean(student),
  });
});

// 3. Активные проекты организации (GET /api/v1/organizations/projects и GET /api/organizations/projects)
const handleGetOrgProjects = async (_req: Request, res: Response) => {
  const activeProjects = FALLBACK_PROJECTS.map((p) => ({
    ...p,
    projectStatus: 'ACTIVE',
  }));
  return res.json(activeProjects);
};

app.get('/api/v1/organizations/projects', handleGetOrgProjects);
app.get('/api/organizations/projects', handleGetOrgProjects);

// 4. Семантические матчи кандидатов под проект (GET /api/v1/organizations/projects/:id/matches)
const handleGetProjectMatches = async (req: Request, res: Response) => {
  const rawId = typeof req.params.id === 'string' ? req.params.id : '';
  const projectId = parseInt(rawId, 10);
  const targetProject = FALLBACK_PROJECTS.find((p) => p.id === projectId);
  if (!targetProject) {
    return res.status(404).json({ error: 'Проект не найден' });
  }

  const matches = FALLBACK_STUDENTS.map((student) => {
    const studentSkills = student.skills.map((s) => s.name.toLowerCase());
    const matchedSkills = student.skills.filter((s) =>
      targetProject.tags.some((t) => t.toLowerCase() === s.name.toLowerCase())
    );
    const missingSkills = targetProject.tags.filter(
      (t) => !studentSkills.includes(t.toLowerCase())
    );

    const matchRatio = matchedSkills.length / (targetProject.tags.length || 1);
    const matchScore = Math.min(98, Math.max(50, Math.round(50 + matchRatio * 48)));

    return {
      studentId: student.id,
      studentName: student.name,
      projectId: targetProject.id,
      projectTitle: targetProject.title,
      matchScore,
      matchedSkills,
      missingSkills,
    };
  });

  return res.json(matches);
};

app.get('/api/v1/organizations/projects/:id/matches', handleGetProjectMatches);
app.get('/api/organizations/projects/:id/matches', handleGetProjectMatches);

// 5. Семантический матч через эмбеддинги ai-service (MiniLM-L12-v2, шкала 0-100)
type SemanticMatchPair = {
  key: string;
  studentSkills: Array<{ name: string; proficiency_level?: string }> | string[];
  projectRequirements: Array<{ name: string; importance_level?: string }> | string[];
};

app.post('/api/v1/semantic-match', async (req: Request, res: Response) => {
  const pairs = (req.body as { pairs?: SemanticMatchPair[] })?.pairs;
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return res.status(400).json({ error: 'Ожидается непустой массив pairs' });
  }

  try {
    const results = await Promise.all(
      pairs.map(async (pair) => ({
        key: pair.key,
        matchScore: await aiService.match(pair.studentSkills, pair.projectRequirements),
      })),
    );
    return res.json({ source: 'ai-service', results });
  } catch (err) {
    console.warn('[AI notice] semantic-match недоступен, отдаём 502:', err);
    return res.status(502).json({ error: 'AI-сервис недоступен' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
