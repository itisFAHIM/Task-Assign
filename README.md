# Task & Annotate App

A 2-in-1 full-stack web application combining a **Kanban-style task manager** with a **multi-view image annotation tool**. Built as a full-stack engineering demonstration project.

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Django, Django REST Framework, PostgreSQL (production) / SQLite (local dev)
- **Auth:** JWT (djangorestframework-simplejwt)

## Live Links

| **Live App** | https://task-assign-livid.vercel.app |
| **Backend API** | https://task-assign-whnz.onrender.com |
| **Frontend Repo** | https://github.com/itisFAHIM/Task-Assign/tree/main/frontend |
| **Backend Repo** | https://github.com/itisFAHIM/Task-Assign/tree/main/backend |

### Demo Account
```
Email:    demo@example.com
Password: password123


## Running Locally

**Backend setup:** see [`backend/README.md`](./backend/README.md)
**Frontend setup:** see [`frontend/README.md`](./frontend/README.md)

Quick start (two terminals):

```bash
# Terminal 1 — backend
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Backend runs at `http://localhost:8000`, frontend at `http://localhost:3000`.