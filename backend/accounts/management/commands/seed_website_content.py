from django.core.management.base import BaseCommand
from accounts.models import WebsiteContent, User


class Command(BaseCommand):
    help = 'Seed the database with initial website content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding website content...')

        # Get or create admin user for updated_by field
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            import os, secrets
            # Use env var if set, otherwise generate a strong random password
            # NEVER use a hardcoded default password in production
            admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD') or secrets.token_urlsafe(20)
            admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL') or 'admin@kiwalan-nhs.edu.ph'
            
            self.stdout.write(self.style.WARNING(
                f'No admin user found. Creating one with a generated password. '
                f'Set DJANGO_SUPERUSER_PASSWORD env var to control this.'
            ))
            admin_user = User.objects.create_superuser(
                email=admin_email,
                username='admin',
                password=admin_password,
                role='admin',
                first_name='Admin',
                last_name='User'
            )
            admin_user.is_approved = True
            admin_user.is_verified = True
            admin_user.account_status = 'active'
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Admin created. Password: {admin_password} — save this immediately!'
            ))

        # Content with categories
        content_data = [
            # Home Page
            ('home', 'home_hero_title', 'Kiwalan National High School'),
            ('home', 'home_hero_subtitle', 'Empowering Minds, Shaping Futures'),
            ('home', 'home_feature_1_title', 'Quality Education'),
            ('home', 'home_feature_1_content', 'Comprehensive curriculum designed to prepare students for success in higher education and beyond.'),
            ('home', 'home_feature_2_title', 'Dedicated Faculty'),
            ('home', 'home_feature_2_content', 'Experienced and passionate teachers committed to student development and academic excellence.'),
            ('home', 'home_feature_3_title', 'Modern Facilities'),
            ('home', 'home_feature_3_content', 'State-of-the-art classrooms, laboratories, and facilities to support holistic learning experiences.'),
            
            # About Page
            ('about', 'about_title', 'About Our School'),
            ('about', 'about_subtitle', 'Dedicated to excellence in education since our founding.'),
            ('about', 'about_mission_title', 'Our Mission'),
            ('about', 'about_mission_content', 'To provide quality education that develops students academic excellence, moral character, and practical skills, preparing them to become responsible and productive citizens who contribute positively to society.'),
            ('about', 'about_vision_title', 'Our Vision'),
            ('about', 'about_vision_content', 'To be a leading educational institution recognized for academic excellence, innovative teaching methods, and graduates who are globally competitive and morally upright individuals.'),
            ('about', 'about_history_title', 'Our History'),
            ('about', 'about_history_content', 'Kiwalan National High School was established with the vision of providing accessible and quality education to the youth of Kiwalan and its neighboring communities. Over the years, we have grown from a small learning institution to a comprehensive high school serving hundreds of students.'),
            
            # Contact Page
            ('contact', 'contact_title', 'Contact Us'),
            ('contact', 'contact_subtitle', 'We are here to help and answer any questions you might have.'),
            ('contact', 'contact_address', 'Kiwalan, Philippines'),
            ('contact', 'contact_email', 'info@kiwalan-nhs.edu.ph'),
            ('contact', 'contact_phone', '(123) 456-7890'),
            ('contact', 'contact_map_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3947.518!2d124.234!3d8.234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMTQnMDIuNCJOIDEyNMKwMTQnMDIuNCJF!5e0!3m2!1sen!2sph!4v1234567890'),
            
            # Programs Page
            ('programs', 'programs_title', 'Our Programs'),
            ('programs', 'programs_subtitle', 'Discover the diverse educational opportunities we offer at Kiwalan National High School'),
            ('programs', 'programs_academic_title', 'Academic Programs'),
            ('programs', 'programs_academic_content', 'Our academic programs provide a strong foundation in core subjects including Mathematics, Science, English, Filipino, and Social Studies. We offer advanced placement courses and specialized tracks for students preparing for higher education.'),
            ('programs', 'programs_academic_details', 'Our Academic Program is designed for students aiming for higher education. We focus on:\n\n• Advanced Mathematics and Science\n• Critical Thinking and Research\n• Language Proficiency in English and Filipino\n• Social Sciences and Humanities\n\nStudents in this track are prepared for various college entrance exams and university life.'),
            ('programs', 'programs_tech_title', 'Technical-Vocational Programs'),
            ('programs', 'programs_tech_content', 'We offer technical-vocational education and training (TVET) programs that equip students with practical skills in various fields including ICT, Electronics, and Automotive. These programs prepare students for immediate employment or further technical education.'),
            ('programs', 'programs_tech_details', 'Our TVET Program provides hands-on training and industry-standard skills. Specializations include:\n\n• Information and Communications Technology (ICT)\n• Electronics Product Assembly and Servicing\n• Automotive Servicing\n• Food and Beverage Services\n\nGraduates receive National Certificates (NC) which are recognized for immediate employment.'),
            ('programs', 'programs_sports_title', 'Sports Development'),
            ('programs', 'programs_sports_content', 'Our sports program focuses on developing athletic skills, teamwork, and discipline. We offer training in basketball, volleyball, football, athletics, and other sports. Students participate in inter-school competitions and regional tournaments.'),
            ('programs', 'programs_sports_details', 'The Sports Program aims to nurture world-class athletes. We offer:\n\n• Intensive Training in Major Sports\n• Nutrition and Physical Wellness Guidance\n• Participation in Regional and National Meets\n• Leadership and Teamwork Workshops\n\nWe believe in developing discipline and character through athletic excellence.'),
            ('programs', 'programs_arts_title', 'Arts and Culture'),
            ('programs', 'programs_arts_content', 'Nurture your creative talents through our arts program. We offer visual arts, music, dance, and theater classes. Students showcase their talents in school programs, competitions, and community events.'),
            ('programs', 'programs_arts_details', 'The Arts and Culture Program is a haven for creative minds. Our offerings include:\n\n• Visual Arts and Design\n• Music Theory and Performance\n• Contemporary and Traditional Dance\n• Theater Arts and Creative Writing\n\nStudents are encouraged to express their unique perspectives and contribute to the rich cultural heritage of our community.'),
        ]

        # Create or update content items — only create if missing, never overwrite existing edits
        created_count = 0
        skipped_count = 0

        # Remove old sections that are no longer in choices
        valid_sections = [item[1] for item in content_data]
        WebsiteContent.objects.exclude(section__in=valid_sections).delete()

        for category, section, content in content_data:
            obj, created = WebsiteContent.objects.get_or_create(
                section=section,
                defaults={
                    'category': category,
                    'content': content,
                    'updated_by': admin_user
                }
            )
            # Always ensure category is set correctly even on existing records
            if not created and obj.category != category:
                obj.category = category
                obj.save(update_fields=['category'])

            if created:
                created_count += 1
                self.stdout.write(f'Created: {section}')
            else:
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded website content! '
            f'Created: {created_count}, Skipped (already exist): {skipped_count}'
        ))
