import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const AnnouncementDetails = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/website-content/public/');
      setContent(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching website content:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-800 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Announcement Details</h1>
          <p className="text-xl text-purple-100">Latest news and updates from Kiwalan National High School</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            {/* Announcement Header */}
            <div className="flex items-center mb-6">
              <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-4 py-2 rounded-full">
                {content.announcement_details_category || 'Academic'}
              </span>
              <span className="text-gray-500 text-sm ml-4">
                {content.announcement_details_date || 'December 15, 2025'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {content.announcement_details_title || 'Enrollment for SY 2026-2027 Now Open'}
            </h2>

            {/* Content */}
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-line">
              {content.announcement_details_content || 'We are pleased to announce that enrollment for the upcoming school year 2026-2027 is now open. Registration is accepting applications for all grade levels from Grade 7 to Grade 12.\n\nRequirements for Enrollment:\n- Report Card (Form 138)\n- Certificate of Good Moral Character\n- Birth Certificate (NSO copy)\n- 2x2 ID Pictures (2 copies)\n- Learner Reference Number (LRN)\n\nEnrollment Schedule:\n- Monday to Friday: 8:00 AM - 4:00 PM\n- Saturday: 8:00 AM - 12:00 PM\n\nFor inquiries, please visit our school office or contact us through the provided contact information.'}
            </div>

            {/* Back Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                to="/"
                className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <div className="bg-purple-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Enroll?</h2>
              <p className="text-gray-600 mb-6">Start your enrollment process today by filling out our online application form.</p>
              <Link
                to="/enroll"
                className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors inline-block"
              >
                Apply for Enrollment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Kiwalan National High School</h3>
              <p className="text-gray-400">Empowering students to achieve academic excellence and personal growth.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/programs" className="text-gray-400 hover:text-white transition-colors">Programs</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Info</h3>
              <p className="text-gray-400">{content.contact_address || 'Kiwalan, Philippines'}</p>
              <p className="text-gray-400 mt-2">{content.contact_email || 'info@kiwalan-nhs.edu.ph'}</p>
              <p className="text-gray-400">{content.contact_phone || '(123) 456-7890'}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Kiwalan National High School. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnnouncementDetails;
