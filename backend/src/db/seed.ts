import { db } from './index.js';
import {
    users,
    organizations,
    students,
    skills,
    projects,
    studentSkills,
    projectSkills,
    projectCategories,
} from './schema.js';

async function seed() {
    console.log('Начало сидирования базы данных...');

    // 1. Пользователи
    const [studentUser] = await db
        .insert(users)
        .values({
            email: 'student@example.com',
            passwordHash: 'hashed_password',
            role: 'STUDENT',
        })
        .returning();

    const [companyUser] = await db
        .insert(users)
        .values({
            email: 'hr@techcompany.ru',
            passwordHash: 'hashed_password',
            role: 'COMPANY',
        })
        .returning();

    // 2. Организация
    const [organization] = await db
        .insert(organizations)
        .values({
            userId: companyUser.id,
            companyName: 'TechLab',
            industry: 'IT',
            city: 'Кемерово',
            description: 'Разработка веб-сервисов и корпоративных порталов.',
            contactEmail: 'hr@techcompany.ru',
            verificationStatus: 'VERIFIED',
        })
        .returning();

    // 3. Студент
    const [student] = await db
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
            bio: 'Backend-разработчик, пишу на Node.js и TypeScript.',
        })
        .returning();

    // 4. Справочники
    const [category] = await db
        .insert(projectCategories)
        .values({
            name: 'Веб-разработка',
            slug: 'web-dev',
            description: 'Веб-сервисы и порталы',
        })
        .returning();

    const skillsData = [
        { name: 'React', slug: 'react', category: 'HARD' as const },
        { name: 'TypeScript', slug: 'typescript', category: 'HARD' as const },
        { name: 'Node.js', slug: 'nodejs', category: 'HARD' as const },
        { name: 'PostgreSQL', slug: 'postgresql', category: 'HARD' as const },
        { name: 'Git', slug: 'git', category: 'TOOL' as const },
        { name: 'Docker', slug: 'docker', category: 'TOOL' as const },
    ];
    const insertedSkills = await db.insert(skills).values(skillsData).returning();
    const getSkillId = (name: string) => insertedSkills.find((s) => s.name === name)!.id;

    // 5. Проект
    const [project] = await db
        .insert(projects)
        .values({
            organizationId: organization.id,
            categoryId: category.id,
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
        .returning();

    // 6. Навыки студента
    await db.insert(studentSkills).values([
        { studentId: student.id, skillId: getSkillId('React'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('TypeScript'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('Node.js'), proficiencyLevel: 'ADVANCED' },
        { studentId: student.id, skillId: getSkillId('PostgreSQL'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('Git'), proficiencyLevel: 'ADVANCED' },
    ]);

    // 7. Требования проекта
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
    ]);

    console.log('Сидирование успешно завершено!');
    console.log('STUDENT_ID=', student.id);
    console.log('PROJECT_ID=', project.id);
    process.exit(0);
}

seed().catch((e) => {
    console.error('Ошибка сидирования:', e);
    process.exit(1);
});
