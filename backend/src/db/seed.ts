import { db } from './index';
import { users, companies, students, skills, projects, studentSkills, projectRequiredSkills } from './schema';

async function seed() {
    console.log('Начало сидирования базы данных...');

    // 1. Создание пользователей
    const [studentUser] = await db.insert(users).values({
        email: 'student@example.com',
        passwordHash: 'hashed_password',
        role: 'STUDENT'
    }).returning();

    const [companyUser] = await db.insert(users).values({
        email: 'hr@techcompany.ru',
        passwordHash: 'hashed_password',
        role: 'COMPANY'
    }).returning();

    // 2. Создание профиля компании
    const [company] = await db.insert(companies).values({
        userId: companyUser.id,
        name: 'TechLab',
        industry: 'IT',
        city: 'Кемерово',
        description: 'Разработка веб-сервисов и корпоративных порталов.'
    }).returning();

    // 3. Создание профиля студента
    const [student] = await db.insert(students).values({
        userId: studentUser.id,
        name: 'Иван Иванов',
        group: 'ФИИТ-221',
        year: '4 курс',
        university: 'КемГУ',
        specialization: 'Фундаментальная информатика и ИТ',
        city: 'Кемерово',
        bio: 'Backend-разработчик, пишу на Node.js и TypeScript.'
    }).returning();

    // 4. Добавление навыков (Skills)
    const skillsData = [
        { name: 'React', category: 'hard' },
        { name: 'TypeScript', category: 'hard' },
        { name: 'Node.js', category: 'hard' },
        { name: 'PostgreSQL', category: 'hard' },
        { name: 'Git', category: 'hard' },
        { name: 'Docker', category: 'hard' }
    ];
    const insertedSkills = await db.insert(skills).values(skillsData).returning();

    const getSkillId = (name: string) => insertedSkills.find(s => s.name === name)!.id;

    // 5. Создание проекта
    const [project] = await db.insert(projects).values({
        companyId: company.id,
        title: 'Веб-сервис координации проектной деятельности',
        company: company.name,
        type: 'ВКР / Диплом',
        description: 'Разработка платформы для соединения студентов с ИТ-компаниями. Фронтенд на React, бэкенд на Node.js/TypeScript.',
    }).returning();

    // 6. Привязка навыков к студенту (что он знает)
    await db.insert(studentSkills).values([
        { studentId: student.id, skillId: getSkillId('React'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('TypeScript'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('Node.js'), proficiencyLevel: 'ADVANCED' },
        { studentId: student.id, skillId: getSkillId('PostgreSQL'), proficiencyLevel: 'INTERMEDIATE' },
        { studentId: student.id, skillId: getSkillId('Git'), proficiencyLevel: 'ADVANCED' }
    ]);

    // 7. Привязка требований к проекту (что нужно знать)
    await db.insert(projectRequiredSkills).values([
        { projectId: project.id, skillId: getSkillId('React'), minProficiencyLevel: 'BASIC' },
        { projectId: project.id, skillId: getSkillId('TypeScript'), minProficiencyLevel: 'INTERMEDIATE' },
        { projectId: project.id, skillId: getSkillId('Node.js'), minProficiencyLevel: 'INTERMEDIATE' },
        { projectId: project.id, skillId: getSkillId('Docker'), minProficiencyLevel: 'BASIC' }
    ]);

    console.log('Сидирование успешно завершено!');
    process.exit(0);
}

seed().catch((e) => {
    console.error('Ошибка сидирования:', e);
    process.exit(1);
});