import { db } from './index.js';
import { sql } from 'drizzle-orm';
import { mustOne } from './mustOne.js';
import { hashPassword } from '../services/authService.js';
import {
    users,
    organizations,
    students,
    skills,
    projects,
    studentSkills,
    projectSkills,
    projectCategories,
    resumes,
    portfolioItems,
    studentConnections,
    applications,
    applicationMembers,
    chats,
    messages,
    notifications,
    systemLogs,
} from './schema.js';

async function seed() {
    console.log('Очистка старых данных...');
    // CASCADE снимает ограничения FK; порядок не важен
    await db.execute(sql`
        TRUNCATE TABLE
            system_logs,
            notifications,
            messages,
            chats,
            application_members,
            applications,
            student_connections,
            portfolio_items,
            resumes,
            project_skills,
            student_skills,
            projects,
            project_categories,
            skills,
            students,
            organizations,
            users
        CASCADE
    `);

    console.log('Начало сидирования базы данных...');
    const passwordHash = await hashPassword('secret_password');

    // === 1. Пользователи ===
    const studentUser = mustOne(
        await db
            .insert(users)
            .values({
                email: 'student@example.com',
                passwordHash,
                role: 'STUDENT',
            })
            .returning(),
        'Пользователь student',
    );

    const partnerUser = mustOne(
        await db
            .insert(users)
            .values({
                email: 'partner@example.com',
                passwordHash,
                role: 'STUDENT',
            })
            .returning(),
        'Пользователь partner',
    );

    const companyUser = mustOne(
        await db
            .insert(users)
            .values({
                email: 'hr@techcompany.ru',
                passwordHash,
                role: 'COMPANY',
            })
            .returning(),
        'Пользователь company',
    );

    const adminUser = mustOne(
        await db
            .insert(users)
            .values({
                email: 'admin@collabhub.ru',
                passwordHash,
                role: 'ADMIN',
            })
            .returning(),
        'Пользователь admin',
    );

    // === 2. Организация ===
    const organization = mustOne(
        await db
            .insert(organizations)
            .values({
                userId: companyUser.id,
                companyName: 'TechLab',
                industry: 'IT',
                city: 'Кемерово',
                description: 'Разработка веб-сервисов и корпоративных порталов.',
                contactPerson: 'Анна Смирнова',
                contactEmail: 'hr@techcompany.ru',
                website: 'https://techlab.example',
                verificationStatus: 'VERIFIED',
                verifiedAt: new Date(),
            })
            .returning(),
        'Организация',
    );

    // === 3. Студенты ===
    const student = mustOne(
        await db
            .insert(students)
            .values({
                userId: studentUser.id,
                firstName: 'Иван',
                lastName: 'Иванов',
                universityGroup: 'ФИИТ-221',
                year: '4 курс',
                university: 'КемГУ',
                specialization: 'Фундаментальная информатика и ИТ',
                city: 'Кемерово',
                telegram: '@ivan_dev',
                bio: 'Backend-разработчик, пишу на Node.js и TypeScript.',
            })
            .returning(),
        'Студент Иван',
    );

    const partner = mustOne(
        await db
            .insert(students)
            .values({
                userId: partnerUser.id,
                firstName: 'Пётр',
                lastName: 'Петров',
                universityGroup: 'ФИИТ-221',
                year: '4 курс',
                university: 'КемГУ',
                specialization: 'Прикладная информатика',
                city: 'Кемерово',
                telegram: '@petr_front',
                bio: 'Frontend-разработчик, React и TypeScript.',
            })
            .returning(),
        'Студент Пётр',
    );

    // === 4. Справочники ===
    const webCat = mustOne(
        await db
            .insert(projectCategories)
            .values({
                name: 'Веб-разработка',
                slug: 'web-dev',
                description: 'Веб-сервисы и порталы',
            })
            .returning(),
        'Категория web-dev',
    );

    const mlCat = mustOne(
        await db
            .insert(projectCategories)
            .values({
                name: 'Data / ML',
                slug: 'data-ml',
                description: 'Аналитика и машинное обучение',
            })
            .returning(),
        'Категория data-ml',
    );

    const skillsData = [
        { name: 'React', slug: 'react', category: 'HARD' as const },
        { name: 'TypeScript', slug: 'typescript', category: 'HARD' as const },
        { name: 'Node.js', slug: 'nodejs', category: 'HARD' as const },
        { name: 'PostgreSQL', slug: 'postgresql', category: 'HARD' as const },
        { name: 'Git', slug: 'git', category: 'TOOL' as const },
        { name: 'Docker', slug: 'docker', category: 'TOOL' as const },
        { name: 'Python', slug: 'python', category: 'HARD' as const },
        { name: 'Английский', slug: 'english', category: 'LANGUAGE' as const },
    ];
    const insertedSkills = await db.insert(skills).values(skillsData).returning();
    const getSkillId = (name: string) => {
        const skill = insertedSkills.find((s) => s.name === name);
        if (!skill) throw new Error(`Навык не найден в seed: ${name}`);
        return skill.id;
    };

    // === 5. Проекты ===
    const project = mustOne(
        await db
            .insert(projects)
            .values({
                organizationId: organization.id,
                categoryId: webCat.id,
                title: 'Веб-сервис координации проектной деятельности',
                description:
                    'Разработка платформы для соединения студентов с ИТ-компаниями. Фронтенд на React, бэкенд на Node.js/TypeScript.',
                expectedResults: 'Работающий MVP платформы',
                conditions: 'Удалённая работа, гибкий график',
                type: 'VKR',
                difficulty: 'JUNIOR',
                employmentType: 'PROJECT',
                status: 'ACTIVE',
                isRemote: true,
            })
            .returning(),
        'Проект 1',
    );

    const project2 = mustOne(
        await db
            .insert(projects)
            .values({
                organizationId: organization.id,
                categoryId: mlCat.id,
                title: 'Аналитический дашборд для внутренних сервисов',
                description:
                    'Сбор метрик, визуализация, предиктивная аналитика на Python. Возможна стажировка.',
                expectedResults: 'Дашборд с метриками и 2-3 моделями прогнозирования',
                conditions: 'Стажировка 3 месяца',
                type: 'INTERNSHIP',
                difficulty: 'MIDDLE',
                employmentType: 'UNPAID_INTERNSHIP',
                status: 'ACTIVE',
                isRemote: true,
            })
            .returning(),
        'Проект 2',
    );

    // === 6. Навыки студентов ===
    await db.insert(studentSkills).values([
        { studentId: student.id, skillId: getSkillId('React'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('TypeScript'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('Node.js'), proficiencyLevel: 'ADVANCED' },
        { studentId: student.id, skillId: getSkillId('PostgreSQL'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('Git'), proficiencyLevel: 'ADVANCED' },
        { studentId: student.id, skillId: getSkillId('Английский'), proficiencyLevel: 'INTERMEDIATE' },

        { studentId: partner.id, skillId: getSkillId('React'), proficiencyLevel: 'ADVANCED' },
        { studentId: partner.id, skillId: getSkillId('TypeScript'), proficiencyLevel: 'ADVANCED' },
        { studentId: partner.id, skillId: getSkillId('Git'), proficiencyLevel: 'INTERMEDIATE' },
    ]);

    // === 7. Требования проектов ===
    await db.insert(projectSkills).values([
        {
            projectId: project.id,
            skillId: getSkillId('React'),
            importanceLevel: 'CRITICAL',
            minProficiencyLevel: 'BASIC',
        },
        {
            projectId: project.id,
            skillId: getSkillId('TypeScript'),
            importanceLevel: 'IMPORTANT',
            minProficiencyLevel: 'INTERMEDIATE',
        },
        {
            projectId: project.id,
            skillId: getSkillId('Node.js'),
            importanceLevel: 'CRITICAL',
            minProficiencyLevel: 'INTERMEDIATE',
        },
        {
            projectId: project.id,
            skillId: getSkillId('Docker'),
            importanceLevel: 'OPTIONAL',
            minProficiencyLevel: 'BASIC',
        },
        {
            projectId: project2.id,
            skillId: getSkillId('Python'),
            importanceLevel: 'CRITICAL',
            minProficiencyLevel: 'INTERMEDIATE',
        },
        {
            projectId: project2.id,
            skillId: getSkillId('PostgreSQL'),
            importanceLevel: 'IMPORTANT',
            minProficiencyLevel: 'BASIC',
        },
    ]);

    // === 8. Резюме ===
    await db.insert(resumes).values([
        {
            studentId: student.id,
            fileName: 'ivan-ivanov-resume.pdf',
            fileUrl: '/uploads/resumes/ivan-ivanov-resume.pdf',
            mimeType: 'application/pdf',
            parsedText:
                'Иван Иванов. Backend: Node.js, TypeScript, PostgreSQL. Опыт учебных проектов 2 года.',
            aiParsedData: {
                skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
                experience: ['Учебный проект — REST API'],
            },
            isPrimary: true,
        },
        {
            studentId: partner.id,
            fileName: 'petr-petrov-cv.pdf',
            fileUrl: '/uploads/resumes/petr-petrov-cv.pdf',
            mimeType: 'application/pdf',
            parsedText: 'Пётр Петров. Frontend: React, TypeScript.',
            aiParsedData: { skills: ['React', 'TypeScript'] },
            isPrimary: true,
        },
    ]);

    // === 9. Портфолио ===
    await db.insert(portfolioItems).values([
        {
            studentId: student.id,
            title: 'API сервиса задач',
            description: 'CRUD, авторизация JWT, Docker Compose',
            role: 'Backend',
            technologies: ['Node.js', 'Express', 'PostgreSQL'],
            startedAt: '2025-02-01',
            finishedAt: '2025-06-01',
        },
        {
            studentId: partner.id,
            title: 'Интерактивный лендинг',
            description: 'React + Framer Motion',
            role: 'Frontend',
            technologies: ['React', 'TypeScript'],
            startedAt: '2025-03-01',
            finishedAt: '2025-05-01',
        },
    ]);

    // === 10. Напарники (student_id < partner_id) ===
    const first = student.id < partner.id ? student : partner;
    const second = student.id < partner.id ? partner : student;
    await db.insert(studentConnections).values({
        studentId: first.id,
        partnerId: second.id,
        status: 'ACCEPTED',
        requestedBy: student.id,
        respondedAt: new Date(),
    });

    // === 11. Отклик + состав команды ===
    const application = mustOne(
        await db
            .insert(applications)
            .values({
                projectId: project.id,
                studentId: student.id,
                isTeam: true,
                status: 'REVIEWING',
                coverLetter: 'Хотим реализовать платформу вдвоём.',
                aiMatchScore: 84.5,
                aiFeedback: {
                    summary: 'Хорошее соответствие стека проекта.',
                    matching_skills: ['Node.js', 'TypeScript', 'React'],
                    missing_skills: ['Docker'],
                    recommendations: ['Изучить Docker'],
                },
            })
            .returning(),
        'Отклик',
    );

    await db.insert(applicationMembers).values([
        {
            applicationId: application.id,
            studentId: student.id,
            projectId: project.id,
            role: 'LEAD',
            aiMatchScore: 86.0,
        },
        {
            applicationId: application.id,
            studentId: partner.id,
            projectId: project.id,
            role: 'MEMBER',
            aiMatchScore: 83.0,
        },
    ]);

    // === 12. Чат и сообщения ===
    const chat = mustOne(
        await db.insert(chats).values({ applicationId: application.id }).returning(),
        'Чат',
    );

    await db.insert(messages).values([
        {
            chatId: chat.id,
            senderId: studentUser.id,
            content: 'Добрый день! Подали командный отклик.',
            status: 'read',
        },
        {
            chatId: chat.id,
            senderId: companyUser.id,
            content: 'Привет! Смотрим заявку, свяжемся по интервью.',
            status: 'sent',
        },
    ]);

    // === 13. Уведомления ===
    await db.insert(notifications).values([
        {
            userId: studentUser.id,
            type: 'APPLICATION_STATUS_CHANGED',
            title: 'Статус отклика изменён',
            body: 'Ваша заявка на проект «Веб-сервис координации» на рассмотрении.',
            link: `/applications/${application.id}`,
        },
        {
            userId: partnerUser.id,
            type: 'FRIEND_ACCEPTED',
            title: 'Запрос в напарники принят',
            body: 'Теперь вы можете подаваться вместе.',
        },
        {
            userId: companyUser.id,
            type: 'NEW_APPLICATION',
            title: 'Новый отклик',
            body: 'Команда Иван Иванов / Пётр Петров откликнулась на ваш проект.',
            link: `/applications/${application.id}`,
        },
    ]);

    // === 14. Системные логи ===
    await db.insert(systemLogs).values([
        {
            level: 'info',
            source: 'backend',
            message: 'Seed выполнен',
            context: { stage: 'database-init' },
            userId: adminUser.id,
        },
        {
            level: 'warn',
            source: 'ai-service',
            message: 'GigaChat недоступен, использован fallback анализа',
            context: { endpoint: '/api/v1/pipeline' },
        },
    ]);

    console.log('Сидирование успешно завершено!');
    console.log('STUDENT_ID=', student.id);
    console.log('PARTNER_ID=', partner.id);
    console.log('PROJECT_ID=', project.id);
    console.log('PROJECT2_ID=', project2.id);
    console.log('APPLICATION_ID=', application.id);
    process.exit(0);
}

seed().catch((e) => {
    console.error('Ошибка сидирования:', e);
    process.exit(1);
});
