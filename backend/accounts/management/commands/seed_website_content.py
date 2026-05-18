from django.core.management.base import BaseCommand
from accounts.models import WebsiteContent, User


class Command(BaseCommand):
    help = 'Seed the database with initial website content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding website content...')

        # Get or create admin user for updated_by field
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            self.stdout.write(self.style.WARNING('No admin user found. Creating one...'))
            admin_user = User.objects.create_superuser(
                email='admin@kiwalan-nhs.edu.ph',
                username='admin',
                password='admin123',
                role='admin',
                first_name='Admin',
                last_name='User'
            )

        # Content with categories
        content_data = [
            # Home Page
            ('home', 'home_hero_title', 'Kiwalan National High School'),
            ('home', 'home_hero_subtitle', 'Empowering Minds, Shaping Futures'),
            ('home', 'home_hero_bg', 'Hero Background Image'),
            ('home', 'home_feature_1_title', 'Quality Education'),
            ('home', 'home_feature_1_content', 'Comprehensive curriculum designed to prepare students for success in higher education and beyond.'),
            ('home', 'home_feature_2_title', 'Dedicated Faculty'),
            ('home', 'home_feature_2_content', 'Experienced and passionate teachers committed to student development and academic excellence.'),
            ('home', 'home_feature_3_title', 'Modern Facilities'),
            ('home', 'home_feature_3_content', 'State-of-the-art classrooms, laboratories, and facilities to support holistic learning experiences.'),
            
            # About Page
            ('about', 'about_title', 'About Our School'),
            ('about', 'about_subtitle', 'Dedicated to excellence in education since our founding.'),
            ('about', 'about_hero_bg', 'About Hero Background'),
            ('about', 'about_side_img', 'About Side Image'),
            ('about', 'about_mission_title', 'Our Mission'),
            ('about', 'about_mission_content', 'To provide quality education that develops students academic excellence, moral character, and practical skills, preparing them to become responsible and productive citizens who contribute positively to society.'),
            ('about', 'about_vision_title', 'Our Vision'),
            ('about', 'about_vision_content', 'To be a leading educational institution recognized for academic excellence, innovative teaching methods, and graduates who are globally competitive and morally upright individuals.'),
            ('about', 'about_history_title', 'Our History'),
            ('about', 'about_history_content', 'Kiwalan National High School was established with the vision of providing accessible and quality education to the youth of Kiwalan and its neighboring communities. Over the years, we have grown from a small learning institution to a comprehensive high school serving hundreds of students.'),
            
            # Contact Page
            ('contact', 'contact_title', 'Contact Us'),
            ('contact', 'contact_subtitle', 'We are here to help and answer any questions you might have.'),
            ('contact', 'contact_hero_bg', 'Contact Hero Background'),
            ('contact', 'contact_address', 'Kiwalan, Philippines'),
            ('contact', 'contact_email', 'info@kiwalan-nhs.edu.ph'),
            ('contact', 'contact_phone', '(123) 456-7890'),
            ('contact', 'contact_map_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3947.518!2d124.234!3d8.234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMTQnMDIuNCJOIDEyNMKwMTQnMDIuNCJF!5e0!3m2!1sen!2sph!4v1234567890'),
            
            # Programs Page
            ('programs', 'programs_title', 'Our Programs'),
            ('programs', 'programs_subtitle', 'Discover the diverse educational opportunities we offer at Kiwalan National High School'),
            ('programs', 'programs_hero_bg', 'Programs Hero Background'),
            ('programs', 'programs_academic_title', 'Academic Programs'),
            ('programs', 'programs_academic_img', 'Academic Program Image'),
            ('programs', 'programs_academic_content', 'Our academic programs provide a strong foundation in core subjects including Mathematics, Science, English, Filipino, and Social Studies. We offer advanced placement courses and specialized tracks for students preparing for higher education.'),
            ('programs', 'programs_tech_title', 'Technical-Vocational Programs'),
            ('programs', 'programs_tech_img', 'Technical Program Image'),
            ('programs', 'programs_tech_content', 'We offer technical-vocational education and training (TVET) programs that equip students with practical skills in various fields including ICT, Electronics, and Automotive. These programs prepare students for immediate employment or further technical education.'),
            ('programs', 'programs_sports_title', 'Sports Development'),
            ('programs', 'programs_sports_img', 'Sports Program Image'),
            ('programs', 'programs_sports_content', 'Our sports program focuses on developing athletic skills, teamwork, and discipline. We offer training in basketball, volleyball, football, athletics, and other sports. Students participate in inter-school competitions and regional tournaments.'),
            ('programs', 'programs_arts_title', 'Arts and Culture'),
            ('programs', 'programs_arts_img', 'Arts Program Image'),
            ('programs', 'programs_arts_content', 'Nurture your creative talents through our arts program. We offer visual arts, music, dance, and theater classes. Students showcase their talents in school programs, competitions, and community events.'),
        ]

        # Create or update content items
        created_count = 0
        updated_count = 0

        # Remove old sections that are no longer in choices
        valid_sections = [item[1] for item in content_data]
        WebsiteContent.objects.exclude(section__in=valid_sections).delete()

        for category, section, content in content_data:
            obj, created = WebsiteContent.objects.update_or_create(
                section=section,
                defaults={
                    'category': category,
                    'content': content,
                    'updated_by': admin_user
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created: {section}')
            else:
                updated_count += 1
                self.stdout.write(f'Updated: {section}')

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded website content! '
            f'Created: {created_count}, Updated: {updated_count}'
        ))
