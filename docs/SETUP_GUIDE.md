# School Portal - Complete Setup and Testing Guide

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create and Activate Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

### 3. Install Dependencies
```bash
pip install -r ../requirements.txt
```

Required packages:
- Django==4.2.7
- djangorestframework==3.14.0
- djangorestframework-simplejwt==5.3.0
- django-cors-headers==4.3.1
- psycopg2-binary==2.9.9

### 4. Run Migrations
```bash
python manage.py makemigrations accounts
python manage.py makemigrations portal
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```
Follow the prompts to create an admin user with:
- Email: admin@school.com
- Username: admin
- Password: (your choice)
- Role: admin

Or use the Django shell:
```bash
python manage.py shell
```
```python
from accounts.models import User
User.objects.create_superuser('admin@school.com', 'admin', 'yourpassword', role='admin')
```

### 6. Start Django Server
```bash
python manage.py runserver
```
Backend will run on: http://localhost:8000

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

Required packages:
- react
- react-dom
- react-router-dom
- axios
- vite
- tailwindcss
- autoprefixer
- postcss

### 3. Start Development Server
```bash
npm run dev
```
Frontend will run on: http://localhost:5173

## Testing the Application

### Step 1: Access Django Admin
1. Open browser to: http://localhost:8000/admin
2. Login with superuser credentials
3. Create test users:
   - Student: student@school.com (role: student)
   - Teacher: teacher@school.com (role: teacher)

### Step 2: Add Sample Data via Admin
1. **Create Courses** (as admin or teacher):
   - Navigate to Portal → Courses
   - Add: "Mathematics" (code: MATH101)
   - Add: "Science" (code: SCI101)
   - Assign teacher to each course

2. **Create Announcements**:
   - Navigate to Portal → Announcements
   - Add: "Welcome to School Portal"
   - Add: "Exam Schedule Released"

3. **Create Grades** (for students):
   - Navigate to Portal → Grades
   - Add grade for student in Mathematics: 85.00
   - Add grade for student in Science: 92.00

### Step 3: Test API Endpoints

Use Postman, curl, or browser to test:

**1. Login (POST)**
```
URL: http://localhost:8000/api/login/
Body: {
  "email": "student@school.com",
  "password": "yourpassword"
}
```
Response should include:
- access token
- refresh token
- user data

**2. Get Announcements (GET)**
```
URL: http://localhost:8000/api/announcements/
```
Should return list of announcements (no auth required)

**3. Get Courses (GET)**
```
URL: http://localhost:8000/api/courses/
Headers: Authorization: Bearer <access_token>
```
Should return list of courses (requires auth)

**4. Get Student Grades (GET)**
```
URL: http://localhost:8000/api/student/grades/
Headers: Authorization: Bearer <access_token>
```
Should return grades for the logged-in student (requires student role)

### Step 4: Test Frontend

1. Open browser to: http://localhost:5173
2. You should see the login page
3. Login with student credentials
4. Navigate to:
   - Dashboard (shows user info)
   - Announcements (shows school news)
   - Grades (shows student grades)

## API Endpoints Summary

### Authentication
- `POST /api/login/` - JWT login (public)
- `GET /api/profile/` - Get current user profile (authenticated)

### Portal
- `GET /api/announcements/` - List announcements (public)
- `POST /api/announcements/` - Create announcement (authenticated)
- `GET /api/courses/` - List courses (authenticated)
- `GET /api/student/grades/` - Get student grades (student role only)

## Troubleshooting

### Migration Issues
If you encounter migration errors:
```bash
python manage.py makemigrations --empty accounts
python manage.py makemigrations --empty portal
python manage.py migrate
```

### CORS Errors
Ensure CORS_ALLOWED_ORIGINS in settings.py includes:
```
"http://localhost:5173",
"http://127.0.0.1:5173"
```

### JWT Token Issues
Check that SIMPLE_JWT settings in settings.py are configured correctly with proper SECRET_KEY.

### Database Issues
To reset the database:
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

## Project Structure

```
├── backend/
│   ├── accounts/              # User authentication
│   │   ├── models.py         # Custom User & Profile
│   │   ├── serializers.py    # User & Profile serializers
│   │   ├── views.py          # Login & profile endpoints
│   │   └── urls.py           # Account URLs
│   ├── portal/               # School features
│   │   ├── models.py         # Announcement, Course, Grade
│   │   ├── serializers.py    # Portal serializers
│   │   ├── views.py          # Portal endpoints
│   │   └── urls.py           # Portal URLs
│   └── school_portal/         # Django settings
│       ├── settings.py       # Configuration
│       └── urls.py           # Root URLs
├── frontend/
│   ├── src/
│   │   ├── components/       # ProtectedRoute, Layout
│   │   ├── pages/            # Login, Dashboard, etc.
│   │   └── utils/            # API & auth utilities
│   └── package.json
└── requirements.txt
```

## Next Steps After Testing

1. **Add more features**:
   - Teacher grade entry
   - Student enrollment
   - Assignment submissions
   - Attendance tracking

2. **Security improvements**:
   - Change SECRET_KEY in production
   - Use HTTPS
   - Implement rate limiting
   - Add email verification

3. **Deployment**:
   - Backend: Render, PythonAnywhere, or AWS
   - Frontend: Vercel, Netlify, or AWS S3
   - Database: PostgreSQL instead of SQLite
