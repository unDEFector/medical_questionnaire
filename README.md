# инКлира — медицинский опрос пациентов

Веб-приложение для первичного и контрольного мониторинга нутритивного риска. Врач создаёт карточку пациента, отправляет персональную ссылку на анкету и видит структурированный результат, рекомендации и динамику показателей.

## Реализованные сценарии

- создание карточки пациента и автоматическая исходная анкета;
- пошаговый опрос по шести разделам: симптомы ЖКТ, аппетит, питание, жидкость, вес и активность;
- учёт текущего веса и свободного описания самочувствия при контрольном опросе;
- правиловой расчёт низкого, умеренного или высокого риска;
- предупреждение врача и пациента при высоком риске;
- история анкет, графики массы тела и балла симптомов;
- автоматическое планирование следующего опроса через 90 дней;
- поиск пациентов и сводная панель показателей.

Расчёт является демонстрационным скринингом, а не диагностикой. Пороговые правила должны быть проверены и утверждены медицинскими специалистами до клинического использования.

## Быстрый запуск через Docker Compose

Требуются Docker и Docker Compose.

```bash
docker compose up --build
```

После запуска:

- приложение: http://localhost:3000;
- API: http://localhost:8000/api/v1;
- Swagger: http://localhost:8000/docs;
- проверка API: http://localhost:8000/health.

По умолчанию создаются четыре **вымышленных** пациента с демонстрационными результатами. Чтобы начать с пустой базы:

```bash
APP__SEED_DEMO_DATA=false docker compose up --build
```

Данные PostgreSQL и Redis сохраняются в именованных томах. Полное удаление данных выполняется только явно: `docker compose down -v`.

## Технологии

- Backend: Python 3.13, FastAPI 0.165, SQLAlchemy 2 (async), PostgreSQL 18, Redis 7, Alembic.
- Frontend: Node.js 22.12, Next.js 16 (App Router), TypeScript 7, Tailwind CSS, TanStack Query, Zustand.
- Проверки: pytest, Ruff, Black, isort, Vitest, Testing Library, ESLint, Prettier.

## Локальная разработка

### Backend

```bash
cp backend/.env.example backend/.env
# Поднять только PostgreSQL и Redis:
docker compose up -d postgres redis
uv sync --locked
PYTHONPATH=backend uv run alembic upgrade head
PYTHONPATH=backend uv run uvicorn src.main:app --reload
```

Backend читает `backend/.env` через `pydantic-settings`. Настройки сгруппированы в секции `APP__*`, `DATABASE__*` и `REDIS__*`; двойное подчёркивание задаёт вложенность, а посторонние переменные окружения игнорируются.

URL подключений формируются автоматически из отдельных переменных:

- PostgreSQL: `DATABASE__USER_NAME`, `DATABASE__PASSWORD`, `DATABASE__HOST`, `DATABASE__PORT`, `DATABASE__DB_NAME`;
- Redis: `REDIS__HOST`, `REDIS__PORT`, `REDIS__DB`.

Например, параметры PostgreSQL собираются в `postgresql+asyncpg://{user_name}:{password}@{host}:{port}/{db_name}`. Флаг демонстрационных данных задаётся через `APP__SEED_DEMO_DATA`. Для Compose переменные подключения можно задать в корневом `.env`; внутри контейнера используются хосты `postgres` и `redis`.

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm ci --legacy-peer-deps
npm run dev
```

Frontend обращается к `/api/v1`; Next.js перенаправляет запросы на `API_INTERNAL_URL`. Поэтому ключи и внутренние адреса не попадают в клиентский JavaScript.

## Проверки

```bash
uv run ruff check .
uv run black --check .
uv run isort --check-only .
uv run pytest

cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Для проверок frontend нужен Node.js 22.12 или новее. ESLint использует Babel-парсер Next.js без неподдерживаемого пресета `typescript-eslint`; строгая проверка типов выполняется отдельно компилятором TypeScript 7.

## Основные API-эндпоинты

- `GET /api/v1/dashboard` — сводные показатели;
- `GET/POST /api/v1/patients` — список и создание пациентов;
- `GET /api/v1/patients/{id}` — карточка, анкеты и динамика;
- `POST /api/v1/patients/{id}/surveys` — получить или создать текущий контрольный опрос;
- `GET /api/v1/surveys/{token}` — публичная анкета по персональному токену;
- `POST /api/v1/surveys/{token}/submit` — отправка ответов.

## Правила демонстрационной оценки

Сумма ответов по шести вопросам составляет от 0 до 18 баллов. Высокий риск назначается при сумме от 10 баллов или снижении массы на 5% и более; умеренный — при сумме от 5 баллов или снижении массы на 2% и более. Остальные результаты относятся к низкому риску. Правила находятся в `backend/src/services/risk.py`.

## Ограничения MVP

В этой версии нет аутентификации, разграничения прав, шифрования на уровне приложения, отправки email/SMS-напоминаний и аудита доступа. Не используйте её с реальными персональными медицинскими данными до добавления этих механизмов и проведения проверки безопасности.

Исходный концептуальный макет сохранён в `img1.jpg`.
