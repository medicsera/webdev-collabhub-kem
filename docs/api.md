# REST API CollabHubKem

Базовый префикс: `/api/v1`  
Auth: `Authorization: Bearer <token>` (кроме register/login и публичного каталога)

---

## Авторизация (`/api/auth`)

- **POST `/api/auth/register`**
  - Body: JSON
```json
{
  "email": "user@kemsu.ru",
  "password": "secret_password",
  "role": "STUDENT",
  "firstName": "Иван",
  "lastName": "Иванов",
  "universityGroup": "ФИИТ-221",
  "year": "4 курс"
}
```
  - Response (201): JSON
```json
{
  "id": "uuid",
  "email": "user@kemsu.ru",
  "role": "STUDENT",
  "token": "jwt_token_string"
}
```
  - Для `role: "COMPANY"` дополнительно: `companyName`, `industry`, `description`, `contactEmail`

- **POST `/api/auth/login`**
  - Body: JSON
```json
{ "email": "user@kemsu.ru", "password": "secret_password" }
```
  - Response (200): JSON
```json
{ "token": "jwt_token_string", "role": "STUDENT", "id": "uuid" }
```

- **GET `/api/auth/me`** (auth)
  - Response (200): JSON — профиль текущего пользователя + тип профиля (student/organization)

---

## Профиль студента (`/api/students`)

- **GET `/api/students/me`** (STUDENT)
  - Response (200): JSON
```json
{
  "id": "uuid",
  "firstName": "Иван",
  "lastName": "Иванов",
  "universityGroup": "ФИИТ-221",
  "year": "4 курс",
  "university": "КемГУ",
  "specialization": "Информатика",
  "telegram": "@ivan",
  "city": "Кемерово",
  "phone": "+7...",
  "status": "Готов к практике",
  "bio": "...",
  "avatarUrl": "...",
  "skills": [{ "name": "React", "proficiencyLevel": "INTERMEDIATE" }]
}
```

- **PATCH `/api/students/me`** (STUDENT)
  - Body: JSON (любые поля профиля)
  - Response (200): JSON — обновлённый профиль

- **GET `/api/students/:id`** (auth, публичный профиль для компании)
  - Response (200): JSON — публичная часть профиля + навыки + портфолио

### Навыки

- **PUT `/api/students/me/skills`** (STUDENT) — заменить список
  - Body: JSON
```json
{
  "skills": [
    { "skillId": "uuid", "proficiencyLevel": "ADVANCED" },
    { "skillId": "uuid", "proficiencyLevel": "INTERMEDIATE" }
  ]
}
```
  - Response (200): JSON

### Резюме (ФР-02)

- **POST `/api/students/me/resumes`** (STUDENT) — multipart/form-data
  - Field: `file` (PDF/DOCX)
  - Response (201): JSON
```json
{
  "id": "uuid",
  "fileName": "resume.pdf",
  "parsedText": "...",
  "aiParsedData": { "skills": [], "experience": [] },
  "isPrimary": true
}
```

- **GET `/api/students/me/resumes`** (STUDENT)
  - Response (200): JSON — список резюме

- **DELETE `/api/students/me/resumes/:id`** (STUDENT)
  - Response (204)

- **POST `/api/students/me/resumes/:id/analyze`** (STUDENT) — повторный ИИ-разбор
  - Response (200): JSON — `aiParsedData`

### Портфолио (УР-04)

- **GET `/api/students/me/portfolio`** (STUDENT)
  - Response (200): JSON — массив записей

- **POST `/api/students/me/portfolio`** (STUDENT)
  - Body: JSON
```json
{
  "title": "Диплом",
  "description": "...",
  "role": "Backend",
  "technologies": ["Node.js", "PostgreSQL"],
  "url": "https://...",
  "startedAt": "2025-01-01",
  "finishedAt": "2025-06-01"
}
```
  - Response (201): JSON

- **PATCH `/api/students/me/portfolio/:id`** (STUDENT)
  - Body: JSON
  - Response (200): JSON

- **DELETE `/api/students/me/portfolio/:id`** (STUDENT)
  - Response (204)

---

## Напарники / друзья (`/api/connections`)

- **GET `/api/connections`** (STUDENT)
  - Query: `?status=ACCEPTED|PENDING`
  - Response (200): JSON
```json
{
  "connections": [
    {
      "id": "uuid",
      "partner": { "id": "uuid", "firstName": "Пётр", "lastName": "Петров" },
      "status": "ACCEPTED",
      "requestedBy": "uuid"
    }
  ]
}
```

- **POST `/api/connections`** (STUDENT) — отправить запрос
  - Body: JSON
```json
{ "partnerId": "uuid" }
```
  - Response (201): JSON — connection со `status: "PENDING"`
  - Errors: `409` — уже есть связь / это вы сами; сервер нормализует пару (`student_id < partner_id`)

- **POST `/api/connections/:id/accept`** (STUDENT, тот, кому адресован)
  - Response (200): JSON — `status: "ACCEPTED"`

- **POST `/api/connections/:id/reject`** (STUDENT)
  - Response (200): JSON — `status: "REJECTED"`

- **DELETE `/api/connections/:id`** (STUDENT) — отменить/удалить
  - Response (204)

- **GET `/api/connections/search`** (STUDENT)
  - Query: `?q=Иван&group=ФИИТ-221`
  - Response (200): JSON — кандидаты для запроса в напарники

---

## Каталог проектов (`/api/projects`)

- **GET `/api/projects`** (auth или публично)
  - Query: `?search=&type=INTERNSHIP&difficulty=JUNIOR&employmentType=PROJECT&skillId=&categoryId=&status=ACTIVE&page=1&limit=20&sort=createdAt`
  - Response (200): JSON
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "...",
      "organization": { "id": "uuid", "companyName": "TechLab", "avatarUrl": "..." },
      "type": "INTERNSHIP",
      "difficulty": "JUNIOR",
      "employmentType": "PROJECT",
      "status": "ACTIVE",
      "skills": [{ "name": "React", "importanceLevel": "CRITICAL" }],
      "createdAt": "..."
    }
  ],
  "page": 1,
  "total": 42
}
```

- **GET `/api/projects/:id`** (auth)
  - Response (200): JSON — полная карточка: description, expectedResults, conditions, skills, organization, deadline, isRemote, teamSize

- **GET `/api/projects/recommended`** (STUDENT) — ИИ-подбор (ФР-04)
  - Response (200): JSON
```json
{
  "items": [
    {
      "project": { "id": "uuid", "title": "..." },
      "matchScore": 87.5,
      "reasons": ["Совпадают Node.js, PostgreSQL"]
    }
  ]
}
```

### Управление проектами — компания (`/api/organizations/projects`)

- **GET `/api/organizations/projects`** (COMPANY)
  - Query: `?status=DRAFT|ACTIVE|CLOSED|ARCHIVED`
  - Response (200): JSON — свои проекты

- **POST `/api/organizations/projects`** (COMPANY)
  - Body: JSON
```json
{
  "title": "Веб-сервис",
  "description": "...",
  "expectedResults": "...",
  "conditions": "...",
  "categoryId": "uuid",
  "type": "INTERNSHIP",
  "difficulty": "JUNIOR",
  "employmentType": "PROJECT",
  "teamSize": "1–3 студента",
  "city": "Кемерово",
  "isRemote": true,
  "deadline": "2026-06-01T00:00:00Z",
  "skills": [
    { "skillId": "uuid", "importanceLevel": "CRITICAL", "minProficiencyLevel": "INTERMEDIATE" }
  ]
}
```
  - Response (201): JSON — проект + skills; `status: "DRAFT"`

- **PATCH `/api/organizations/projects/:id`** (COMPANY, владелец)
  - Body: JSON — частичное обновление (title, skills, …)
  - Response (200): JSON

- **POST `/api/organizations/projects/:id/publish`** (COMPANY) — DRAFT → ACTIVE
  - Response (200): JSON

- **POST `/api/organizations/projects/:id/close`** (COMPANY) — ACTIVE → CLOSED
  - Response (200): JSON

- **POST `/api/organizations/projects/:id/archive`** (COMPANY) — → ARCHIVED
  - Response (200): JSON

- **DELETE `/api/organizations/projects/:id`** (COMPANY) — только DRAFT
  - Response (204)

---

## Отклики — студент (`/api/applications`)

- **POST `/api/applications`** (STUDENT) — соло или команда
  - Body: JSON
```json
{
  "projectId": "uuid",
  "coverLetter": "...",
  "partnerIds": ["uuid"]
}
```
  - `partnerIds` — опционально; только `ACCEPTED`-напарники; `isTeam` выставляется автоматически
  - Response (201): JSON
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "isTeam": true,
  "status": "PENDING",
  "aiMatchScore": 82.1,
  "aiFeedback": {
    "summary": "...",
    "matching_skills": [],
    "missing_skills": [],
    "recommendations": []
  },
  "members": [
    { "studentId": "uuid", "role": "LEAD", "aiMatchScore": 85.0 },
    { "studentId": "uuid", "role": "MEMBER", "aiMatchScore": 79.2 }
  ]
}
```
  - Errors: `409` — уже откликнулся; `400` — напарник не ACCEPTED; `404` — проект

- **GET `/api/applications/mine`** (STUDENT)
  - Query: `?status=PENDING|REVIEWING|INTERVIEW|ACCEPTED|REJECTED`
  - Response (200): JSON — список с project + status + aiMatchScore

- **GET `/api/applications/:id`** (STUDENT или COMPANY-участник)
  - Response (200): JSON — отклик + members + chat id

- **DELETE `/api/applications/:id`** (STUDENT, lead, только PENDING)
  - Response (204)

---

## Отклики — компания (`/api/organizations/applications`)

- **GET `/api/organizations/applications`** (COMPANY)
  - Query: `?projectId=&status=&page=`
  - Response (200): JSON
```json
{
  "items": [
    {
      "id": "uuid",
      "project": { "id": "uuid", "title": "..." },
      "lead": { "id": "uuid", "firstName": "Иван", "lastName": "Иванов" },
      "isTeam": true,
      "status": "REVIEWING",
      "aiMatchScore": 82.1,
      "aiFeedback": {},
      "members": [
        { "studentId": "uuid", "role": "LEAD", "aiMatchScore": 85.0, "skills": [] }
      ],
      "createdAt": "..."
    }
  ]
}
```

- **GET `/api/organizations/applications/:id`** (COMPANY)
  - Response (200): JSON — профили участников, резюме, ИИ-оценки

- **PATCH `/api/organizations/applications/:id/status`** (COMPANY)
  - Body: JSON
```json
{
  "status": "INTERVIEW",
  "statusComment": "Приглашаем на интервью 15 числа"
}
```
  - Response (200): JSON — отклик с новым статусом; создаётся `notification` участникам
  - Allowed: `REVIEWING` | `INTERVIEW` | `ACCEPTED` | `REJECTED`

- **GET `/api/organizations/projects/:id/matches`** (COMPANY) — ИИ-подбор кандидатов (УР-09, ФР-07)
  - Response (200): JSON
```json
{
  "items": [
    {
      "student": { "id": "uuid", "firstName": "...", "lastName": "..." },
      "matchScore": 91.2,
      "missingSkills": ["Docker"],
      "matchedSkills": ["React", "TypeScript"]
    }
  ]
}
```

---

## Профиль компании (`/api/organizations`)

- **GET `/api/organizations/me`** (COMPANY)
  - Response (200): JSON — профиль + verificationStatus

- **PATCH `/api/organizations/me`** (COMPANY)
  - Body: JSON
  - Response (200): JSON

- **GET `/api/organizations/:id`** (auth) — публичный профиль
  - Response (200): JSON (без verificationNote, если не admin)

---

## Чаты (`/api/chats`)

- **GET `/api/chats`** (auth)
  - Response (200): JSON — чаты текущего пользователя (по его откликам)

- **GET `/api/chats/:id`** (auth, участник)
  - Response (200): JSON — chat + application + participants

- **GET `/api/chats/:id/messages`** (auth, участник)
  - Query: `?page=&limit=`
  - Response (200): JSON — сообщения

- **POST `/api/chats/:id/messages`** (auth, участник)
  - Body: JSON
```json
{ "content": "Здравствуйте!" }
```
  - Response (201): JSON — сообщение; уведомление второму участнику

- **POST `/api/chats/:id/read`** (auth)
  - Response (200): JSON — отмечены прочитанными

---

## Уведомления (`/api/notifications`)

- **GET `/api/notifications`** (auth)
  - Query: `?unread=true&page=`
  - Response (200): JSON
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "APPLICATION_STATUS_CHANGED",
      "title": "Статус отклика изменён",
      "body": "Вас пригласили на интервью",
      "link": "/applications/uuid",
      "isRead": false,
      "createdAt": "..."
    }
  ],
  "unreadCount": 3
}
```

- **POST `/api/notifications/:id/read`** (auth)
  - Response (200)

- **POST `/api/notifications/read-all`** (auth)
  - Response (200): JSON `{ "updated": 12 }`

---

## Админ (`/api/admin`)

### Модерация (УР-11)

- **GET `/api/admin/organizations`** (ADMIN)
  - Query: `?verificationStatus=PENDING|VERIFIED|REJECTED`
  - Response (200): JSON — список организаций

- **PATCH `/api/admin/organizations/:id/verify`** (ADMIN)
  - Body: JSON
```json
{ "status": "VERIFIED", "note": "Документы ОК" }
```
  - Response (200): JSON

- **GET `/api/admin/users`** (ADMIN)
  - Query: `?role=&isBlocked=&search=&page=`
  - Response (200): JSON

- **PATCH `/api/admin/users/:id/block`** (ADMIN)
  - Body: JSON
```json
{ "isBlocked": true, "reason": "Нарушение правил" }
```
  - Response (200): JSON

- **PATCH `/api/admin/users/:id/role`** (ADMIN)
  - Body: JSON
```json
{ "role": "ADMIN" }
```
  - Response (200): JSON

### Справочники (УР-12, ФР-09)

- **GET `/api/admin/skills`** | **POST `/api/admin/skills`** | **PATCH `/api/admin/skills/:id`** | **DELETE `/api/admin/skills/:id`** (ADMIN)
  - POST Body: `{ "name": "Kubernetes", "slug": "kubernetes", "category": "TOOL", "description": "..." }`

- **GET `/api/admin/project-categories`** | **POST** | **PATCH /:id** | **DELETE /:id** (ADMIN)
  - POST Body: `{ "name": "Мобильная разработка", "slug": "mobile" }`

### Логи (ФР-09)

- **GET `/api/admin/system-logs`** (ADMIN)
  - Query: `?level=error|warn|info&source=backend|ai-service&page=`
  - Response (200): JSON — `system_logs`

---

## AI-микросервис (`http://ai-service:8001`) — internal

Вызывается Core Backend, не фронтом напрямую.

- **POST `/api/v1/match`**
  - Body: `{ "student_skills": ["React"], "project_requirements": ["React", "Docker"] }`
  - Response (200): `{ "match_score": 73.5, ... }`

- **POST `/api/v1/analyze`**
  - Body: `{ "student_skills": [], "project_title": "...", "project_description": "...", "project_requirements": [] }`
  - Response (200): `{ "summary", "matching_skills", "missing_skills", "recommendations" }`

- **POST `/api/v1/pipeline`** — match + analyze
  - Response (200): `{ "match_score": ..., "analysis": { ... } }`

- **POST `/api/v1/embed`** *(рекомендуемый, для pgvector)*
  - Body: `{ "text": "..." }` или `{ "texts": ["..."] }`
  - Response (200): `{ "embeddings": ["[0.1,...]"] }`

- **GET `/api/v1/health`**
  - Response (200): `{ "status": "healthy", "model": "..." }`

---

## Health (Core Backend)

- **GET `/api/v1/health`**
  - Response (200): `{ "status": "ok", "service": "CollabHub Backend API" }`

---

## Сводка по ролям

| Роль | Основные маршруты |
|---|---|
| Гость | `auth/register`, `auth/login`, `GET projects`, `GET projects/:id` |
| STUDENT | `students/me*`, `connections*`, `applications*`, `GET projects/recommended`, `chats*`, `notifications*` |
| COMPANY | `organizations/me*`, `organizations/projects*`, `organizations/applications*`, `projects/:id/matches` |
| ADMIN | `admin/organizations*`, `admin/users*`, `admin/skills*`, `admin/project-categories*`, `admin/system-logs*` |
