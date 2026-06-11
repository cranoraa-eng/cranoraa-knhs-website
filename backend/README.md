# School Portal Backend

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Create a superuser:
```bash
python manage.py createsuperuser
```

5. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

- POST /api/login/ - JWT Authentication
- GET /api/announcements/ - Public announcements
- GET /api/student/grades/ - Student grades (requires authentication)
