# School Portal - Full Stack Boilerplate

A complete school website boilerplate with Django REST Framework backend and React frontend.

## Tech Stack

**Backend:**
- Django 4.2.7
- Django REST Framework
- djangorestframework-simplejwt (JWT Authentication)
- django-cors-headers
- SQLite (PostgreSQL ready for production)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

## Project Structure

```
├── backend/
│   ├── accounts/          # User authentication and profiles
│   │   ├── models.py      # Custom User model with roles (Admin, Teacher, Student)
│   │   ├── serializers.py # User and Profile serializers
│   │   └── views.py       # Login and profile endpoints
│   ├── portal/            # School portal features
│   │   ├── models.py      # Announcement, Course, Grade models
│   │   ├── serializers.py # Portal serializers
│   │   └── views.py       # Announcements, courses, grades endpoints
│   └── school_portal/     # Django project settings
├── frontend/
│   ├── src/
│   │   ├── components/    # ProtectedRoute, Layout
│   │   ├── pages/         # Login, Dashboard, Announcements, Grades
│   │   └── utils/         # API and auth utilities
│   └── package.json
└── requirements.txt
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r ../requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

Backend will run on http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/login/` - JWT login (returns access and refresh tokens)
- `GET /api/profile/` - Get current user profile (authenticated)

### Portal
- `GET /api/announcements/` - Public announcements feed
- `GET /api/courses/` - List all courses (authenticated)
- `GET /api/student/grades/` - Get student grades (student role only)

## Features

### Backend
- Custom User model with three roles: Admin, Teacher, Student
- Profile model for school-specific data (grade level, employee ID)
- JWT authentication with Simple JWT
- Permission classes for role-based access control
- Django Admin integration for easy data management

### Frontend
- JWT-based authentication flow
- Protected routes with role-based navigation
- Responsive dashboard with sidebar layout
- Announcements feed with author and date info
- Student grades table view
- Clean, modern UI with Tailwind CSS

## Database Models

### User (Custom)
- email (unique)
- username
- role (admin/teacher/student)
- Profile (OneToOne)

### Profile
- grade_level (for students)
- employee_id (for teachers)
- phone_number
- address
- date_of_birth

### Announcement
- title
- content
- author (ForeignKey to User)
- is_active
- created_at, updated_at

### Course
- name
- code (unique)
- description
- teacher (ForeignKey to User)

### Grade
- student (ForeignKey to User)
- course (ForeignKey to Course)
- grade (Decimal)
- semester
- academic_year

## Next Steps

1. Run the backend and frontend servers
2. Create a superuser and log into Django Admin at http://localhost:8000/admin
3. Create test users with different roles (student, teacher)
4. Add sample announcements, courses, and grades
5. Test the login flow on the frontend
6. Deploy to production (change SECRET_KEY, use PostgreSQL, configure CORS)

## Production Deployment Notes

- Change `SECRET_KEY` in settings.py
- Switch to PostgreSQL database
- Update `CORS_ALLOWED_ORIGINS` with your frontend domain
- Set `DEBUG = False`
- Configure static files serving
- Use environment variables for sensitive data
