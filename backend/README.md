The backend of Task and Image Annotation application. Built with Django and Django REST Framework, this API helps the dynamic frontend with a proper authentication, task tracking and image storage with edit and changes.

## The issues I Faced (And Solved)

### Issue 1: The Cross-Origin Menace
When running Django on port 8000 and Next.js on port 3000, the browser blocks requests. Later I found it occurs because of the Same origin policy.
I solved it by using django-cors-headers and configured CORS_ALLOW_ALL_ORIGINS and set it in True for easily overcome the CORS issue during development.



## Environment & Setup Instructions

**Node Version**: v24.14.1
**Python Version**: Python 3.12.10


1. **Clone the repo**:
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment or venv**:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
 
 3. **Install dependencies**:
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers pillow
   ```
   
4. **Run Migrations (SQLite Database)**:
   ```bash
   python manage.py migrate
   ```
5. **Create a superuser (optional)**:
   ```bash 
   python manage.py createsuperuser
   ```

6. **Run the server**:
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000/`.


   ### DEMO ACCOUNTS: for testing: Email: `demo@example.com` / password: `password123`.*
