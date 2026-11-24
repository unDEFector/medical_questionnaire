# AGENTS.md

## Обзор проекта

`medical-questionnaire` (`инКлира`) — веб-приложение для первичного и контрольного медицинского опроса пациентов. Врач создаёт обезличенную карточку и учётные данные, пациент заполняет анкету в своём кабинете, врач видит ответы и red flags.

- Версия: `0.1.0`.
- Python `>=3.13`, менеджер зависимостей `uv`.
- Backend: FastAPI 0.165.x, SQLAlchemy 2.x, PostgreSQL 18, Redis 7, Alembic.
- Frontend: Node.js 22.12.x, Next.js 16.x, TypeScript 7.x, Tailwind CSS.
- Основной способ запуска: Docker Compose (`compose.yaml`).
- Документация на русском языке.

Структура вопросов находится в `backend/src/services/questionnaire.py` и соответствует первой версии `questionnaire.docx`. Автоматический медицинский скоринг не выполняется: положительные ответы 25–31 помечаются как red flags для оценки врачом. До использования с реальными пациентами необходимы защищённое развёртывание, аудит и проверка защиты медицинских данных.

## Структура

```text
.
├── backend/
│   ├── alembic/        # Миграции PostgreSQL
│   ├── src/
│   │   ├── api/        # HTTP-роуты
│   │   ├── cache/      # Redis
│   │   ├── db/         # AsyncSession и демонстрационные данные
│   │   ├── models/     # SQLAlchemy-модели
│   │   ├── schemas/    # Pydantic-схемы
│   │   ├── services/   # Бизнес-логика
│   │   └── main.py
│   └── tests/
├── frontend/
│   ├── src/app/        # Next.js App Router
│   ├── src/components/
│   ├── src/lib/
│   ├── src/store/
│   └── src/types/
├── compose.yaml
├── Dockerfile.backend
├── pyproject.toml
└── uv.lock
```

Более близкие правила находятся в `backend/AGENTS.md` и `frontend/AGENTS.md` и имеют приоритет для соответствующих каталогов. Явная инструкция пользователя имеет приоритет над файлами AGENTS.md.

## Запуск и конфигурация

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`.
- Backend: `http://localhost:8000`, Swagger: `/docs`.
- Демонстрационные вымышленные пациенты включаются переменной `APP__SEED_DEMO_DATA=true` (по умолчанию в Compose).
- Backend использует вложенные настройки с разделителем `__`: секции `APP__*`, `AUTH__*`, `DATABASE__*`, `REDIS__*`. Лишние переменные окружения игнорируются.
- Пароли хешируются Argon2; Bearer-токены хранятся в БД как SHA-256-хеши. Доступ проверяется зависимостями `backend/src/api/dependencies.py`: пациент может читать и отправлять только собственные анкеты, врач управляет карточками и дополнительными полями.
- URL PostgreSQL собирается из `DATABASE__USER_NAME`, `DATABASE__PASSWORD`, `DATABASE__HOST`, `DATABASE__PORT`, `DATABASE__DB_NAME`; URL Redis — из `REDIS__HOST`, `REDIS__PORT`, `REDIS__DB`. Задавать готовые `DATABASE__URL` и `REDIS__URL` не требуется.
- Шаблоны: `backend/.env.example`, `frontend/.env.example`. Локальные `.env` не коммитить.
- При добавлении Python-зависимостей обновлять `pyproject.toml` и `uv.lock` через `uv`.
- Миграции применяются автоматически при запуске backend-контейнера.

## Проверки

Backend из корня:

```bash
uv lock --check
uv sync --locked
uv run ruff check .
uv run black --check .
uv run isort --check-only .
uv run pytest
```

Frontend из `frontend` с Node.js 22.12+:

```bash
npm ci --legacy-peer-deps
npm run lint
npm run typecheck
npm run test
npm run build
```

ESLint использует Babel-парсер Next.js без пресета `typescript-eslint`, который пока несовместим с TypeScript 7; строгая проверка выполняется отдельно компилятором TypeScript 7.

## Стиль и правила

- Python: четыре пробела, типизация публичных функций, Black, isort и Ruff по `pyproject.toml`.
- Async SQLAlchemy для всех обращений к БД; бизнес-логика в сервисах, тонкие роуты.
- Коммиты БД выполняются в роутах или unit-of-work, не в сервисах.
- Изменения схемы БД только через новые Alembic-миграции.
- Frontend: strict TypeScript, функциональные компоненты, доступные состояния фокуса и адаптивная вёрстка.
- Не редактировать `.next/`, `.venv/`, `node_modules/` и другие сгенерированные каталоги.
- Секреты и реальные медицинские данные не добавлять в отслеживаемые файлы или логи.

## Развёртывание

Контейнеры `postgres`, `redis`, `backend`, `frontend` описаны в `compose.yaml`. Данные БД и Redis находятся в именованных томах. Production-окружение, HTTPS, управление секретами и CI/CD пока не настроены; не выдумывать целевую платформу.
