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

        # Home page content
        home_content = [
            {
                'section': 'home_hero_title',
                'content': 'Kiwalan National High School'
            },
            {
                'section': 'home_hero_subtitle',
                'content': 'Empowering Minds, Shaping Futures'
            },
            {
                'section': 'home_announcement_1_category',
                'content': 'Academic'
            },
            {
                'section': 'home_announcement_1_date',
                'content': 'December 15, 2025'
            },
            {
                'section': 'home_announcement_1_title',
                'content': 'Enrollment for SY 2026-2027 Now Open'
            },
            {
                'section': 'home_announcement_1_content',
                'content': 'Registration for the upcoming school year is now accepting applications. Visit our campus or apply online.'
            },
            {
                'section': 'home_announcement_1_link_text',
                'content': 'Learn more →'
            },
            {
                'section': 'home_announcement_2_category',
                'content': 'Events'
            },
            {
                'section': 'home_announcement_2_date',
                'content': 'December 10, 2025'
            },
            {
                'section': 'home_announcement_2_title',
                'content': 'Annual School Foundation Day'
            },
            {
                'section': 'home_announcement_2_content',
                'content': 'Join us in celebrating our school foundation day with various activities and programs.'
            },
            {
                'section': 'home_announcement_2_link_text',
                'content': 'Learn more →'
            },
        ]

        # About page content
        about_content = [
            {
                'section': 'about_mission',
                'content': 'To provide quality education that develops students academic excellence, moral character, and practical skills, preparing them to become responsible and productive citizens who contribute positively to society.'
            },
            {
                'section': 'about_vision',
                'content': 'To be a leading educational institution recognized for academic excellence, innovative teaching methods, and graduates who are globally competitive and morally upright individuals.'
            },
            {
                'section': 'about_history',
                'content': 'Kiwalan National High School was established with the vision of providing accessible and quality education to the youth of Kiwalan and its neighboring communities. Over the years, we have grown from a small learning institution to a comprehensive high school serving hundreds of students.'
            },
        ]

        # Programs page content
        programs_content = [
            {
                'section': 'programs_title',
                'content': 'Our Programs'
            },
            {
                'section': 'programs_subtitle',
                'content': 'Discover the diverse educational opportunities we offer at Kiwalan National High School'
            },
            {
                'section': 'programs_academic_title',
                'content': 'Academic Programs'
            },
            {
                'section': 'programs_academic_content',
                'content': 'Our academic programs provide a strong foundation in core subjects including Mathematics, Science, English, Filipino, and Social Studies. We offer advanced placement courses and specialized tracks for students preparing for higher education.'
            },
            {
                'section': 'programs_tech_title',
                'content': 'Technical-Vocational Programs'
            },
            {
                'section': 'programs_tech_content',
                'content': 'We offer technical-vocational education and training (TVET) programs that equip students with practical skills in various fields including ICT, Electronics, and Automotive. These programs prepare students for immediate employment or further technical education.'
            },
            {
                'section': 'programs_sports_title',
                'content': 'Sports Development'
            },
            {
                'section': 'programs_sports_content',
                'content': 'Our sports program focuses on developing athletic skills, teamwork, and discipline. We offer training in basketball, volleyball, football, athletics, and other sports. Students participate in inter-school competitions and regional tournaments.'
            },
            {
                'section': 'programs_arts_title',
                'content': 'Arts and Culture'
            },
            {
                'section': 'programs_arts_content',
                'content': 'Nurture your creative talents through our arts program. We offer visual arts, music, dance, and theater classes. Students showcase their talents in school programs, competitions, and community events.'
            },
        ]

        # Contact page content
        contact_content = [
            {
                'section': 'contact_address',
                'content': 'Kiwalan, Philippines'
            },
            {
                'section': 'contact_email',
                'content': 'info@kiwalan-nhs.edu.ph'
            },
            {
                'section': 'contact_phone',
                'content': '(123) 456-7890'
            },
            {
                'section': 'contact_office_hours',
                'content': 'Monday - Friday: 7:00 AM - 5:00 PM\nSaturday: 8:00 AM - 12:00 PM'
            },
        ]

        # Combine all content
        all_content = home_content + about_content + programs_content + contact_content

        # Create or update content items
        created_count = 0
        updated_count = 0

        for item_data in all_content:
            section = item_data['section']
            content = item_data['content']
            
            obj, created = WebsiteContent.objects.get_or_create(
                section=section,
                defaults={
                    'content': content,
                    'updated_by': admin_user
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created: {section}')
            else:
                obj.content = content
                obj.updated_by = admin_user
                obj.save()
                updated_count += 1
                self.stdout.write(f'Updated: {section}')

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded website content! '
            f'Created: {created_count}, Updated: {updated_count}'
        ))
