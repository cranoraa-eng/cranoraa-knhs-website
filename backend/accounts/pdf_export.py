"""
PDF Export utilities for Enrollment Management System.
Generates professional school-branded enrollment documents.
Falls back to HTML download if PDF library is unavailable.
"""
import io
import logging
from django.http import HttpResponse
from django.utils import timezone

logger = logging.getLogger(__name__)

try:
    from xhtml2pdf import pisa
    HAS_PDF = True
except ImportError:
    HAS_PDF = False
    logger.warning("xhtml2pdf not installed. PDF exports will use HTML fallback. "
                    "Install with: pip install xhtml2pdf")


SCHOOL_NAME = "Kiwalan National High School"
SCHOOL_ADDRESS = "Kiwalan, Iligan City, Lanao del Norte"
SCHOOL_CONTACT = "(063) 221-XXXX"


def _base_css():
    return """
    @page {
        size: A4;
        margin: 1.5cm 2cm;
    }
    body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11pt;
        color: #1a1a1a;
        line-height: 1.5;
    }
    .header {
        text-align: center;
        border-bottom: 3px solid #2D1B4D;
        padding-bottom: 12px;
        margin-bottom: 20px;
    }
    .header h1 {
        font-size: 18pt;
        color: #2D1B4D;
        margin: 0;
        letter-spacing: 1px;
    }
    .header h2 {
        font-size: 13pt;
        color: #6B21A8;
        margin: 4px 0 0 0;
        font-weight: normal;
    }
    .header p {
        font-size: 9pt;
        color: #666;
        margin: 2px 0 0 0;
    }
    .section-title {
        font-size: 12pt;
        font-weight: bold;
        color: #2D1B4D;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
        margin: 18px 0 10px 0;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }
    table td {
        padding: 5px 8px;
        vertical-align: top;
        border-bottom: 1px solid #f0f0f0;
    }
    table td.label {
        font-weight: bold;
        color: #555;
        width: 35%;
        font-size: 10pt;
    }
    table td.value {
        color: #1a1a1a;
    }
    .two-col {
        display: flex;
        gap: 20px;
    }
    .two-col > div {
        flex: 1;
    }
    .footer {
        margin-top: 30px;
        padding-top: 10px;
        border-top: 2px solid #2D1B4D;
        text-align: center;
        font-size: 8pt;
        color: #888;
    }
    .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 4px;
        font-size: 9pt;
        font-weight: bold;
        color: white;
    }
    .badge-pending { background: #F59E0B; }
    .badge-approved { background: #10B981; }
    .badge-rejected { background: #EF4444; }
    .badge-enrolled { background: #7C3AED; }
    .badge-review { background: #3B82F6; }
    .badge-reqs { background: #F97316; }
    .signature-area {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
    }
    .signature-block {
        text-align: center;
        width: 40%;
    }
    .signature-line {
        border-top: 1px solid #333;
        margin-top: 50px;
        padding-top: 5px;
        font-size: 9pt;
    }
    """


STATUS_MAP = {
    'pending': ('Pending', 'badge-pending'),
    'under_review': ('Under Review', 'badge-review'),
    'pending_requirements': ('Pending Requirements', 'badge-reqs'),
    'approved': ('Approved', 'badge-approved'),
    'rejected': ('Rejected', 'badge-rejected'),
    'enrolled': ('Enrolled', 'badge-enrolled'),
}


def _render_html(template_html, context):
    """Replace simple {{key}} placeholders with context values."""
    html = template_html
    for key, value in context.items():
        html = html.replace('{{' + key + '}}', str(value or ''))
    return html


def generate_enrollment_form_pdf(application):
    """Generate a professional enrollment form PDF for a single application."""
    status_label, status_class = STATUS_MAP.get(application.status, ('Unknown', ''))

    html_content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>{_base_css()}</style>
</head><body>
<div class="header">
    <h1>{SCHOOL_NAME}</h1>
    <h2>ENROLLMENT APPLICATION FORM</h2>
    <p>{SCHOOL_ADDRESS} | {SCHOOL_CONTACT}</p>
</div>

<table>
<tr><td class="label">Enrollment Number:</td><td class="value"><strong>{application.enrollment_number or 'N/A'}</strong></td></tr>
<tr><td class="label">Enrollment Type:</td><td class="value">{application.get_enrollment_type_display()}</td></tr>
<tr><td class="label">School Year:</td><td class="value">{application.school_year or 'N/A'}</td></tr>
<tr><td class="label">Status:</td><td class="value"><span class="badge {status_class}">{status_label}</span></td></tr>
<tr><td class="label">Date Submitted:</td><td class="value">{application.submitted_at.strftime('%B %d, %Y') if application.submitted_at else 'N/A'}</td></tr>
</table>

<div class="section-title">I. PERSONAL INFORMATION</div>
<table>
<tr><td class="label">Full Name:</td><td class="value">{application.last_name}, {application.first_name} {application.middle_name or ''}</td></tr>
<tr><td class="label">Sex / Gender:</td><td class="value">{application.get_sex_display()}</td></tr>
<tr><td class="label">Date of Birth:</td><td class="value">{application.date_of_birth.strftime('%B %d, %Y') if application.date_of_birth else 'N/A'} (Age: {application.age or 'N/A'})</td></tr>
<tr><td class="label">Place of Birth:</td><td class="value">{application.place_of_birth or 'N/A'}</td></tr>
<tr><td class="label">Nationality:</td><td class="value">{application.nationality or 'N/A'}</td></tr>
<tr><td class="label">Religion:</td><td class="value">{application.religion or 'N/A'}</td></tr>
</table>

<div class="section-title">II. ADDRESS INFORMATION</div>
<table>
<tr><td class="label">Street Address:</td><td class="value">{application.street_address}</td></tr>
<tr><td class="label">Barangay:</td><td class="value">{application.barangay}</td></tr>
<tr><td class="label">City / Municipality:</td><td class="value">{application.city_municipality}</td></tr>
<tr><td class="label">Province:</td><td class="value">{application.province}</td></tr>
<tr><td class="label">Zip Code:</td><td class="value">{application.zip_code or 'N/A'}</td></tr>
</table>

<div class="section-title">III. CONTACT INFORMATION</div>
<table>
<tr><td class="label">Email Address:</td><td class="value">{application.email}</td></tr>
<tr><td class="label">Phone Number:</td><td class="value">{application.phone_number}</td></tr>
</table>

<div class="section-title">IV. PARENT / GUARDIAN INFORMATION</div>
<table>
<tr><td class="label">Father's Name:</td><td class="value">{application.father_name or 'N/A'}</td></tr>
<tr><td class="label">Father's Occupation:</td><td class="value">{application.father_occupation or 'N/A'}</td></tr>
<tr><td class="label">Father's Contact:</td><td class="value">{application.father_contact or 'N/A'}</td></tr>
<tr><td class="label">Mother's Name:</td><td class="value">{application.mother_name or 'N/A'}</td></tr>
<tr><td class="label">Mother's Occupation:</td><td class="value">{application.mother_occupation or 'N/A'}</td></tr>
<tr><td class="label">Mother's Contact:</td><td class="value">{application.mother_contact or 'N/A'}</td></tr>
</table>
<table>
<tr><td class="label">Guardian Name:</td><td class="value">{application.guardian_name or 'N/A'}</td></tr>
<tr><td class="label">Relationship:</td><td class="value">{application.guardian_relationship or 'N/A'}</td></tr>
<tr><td class="label">Contact Number:</td><td class="value">{application.guardian_contact or 'N/A'}</td></tr>
</table>

<div class="section-title">V. ACADEMIC INFORMATION</div>
<table>
<tr><td class="label">Grade Level Applied For:</td><td class="value">Grade {application.grade_level}</td></tr>
<tr><td class="label">Strand:</td><td class="value">{application.strand or 'N/A'}</td></tr>
<tr><td class="label">LRN:</td><td class="value">{application.lrn or 'N/A'}</td></tr>
<tr><td class="label">Previous School:</td><td class="value">{application.previous_school or 'N/A'}</td></tr>
<tr><td class="label">Previous School Address:</td><td class="value">{application.previous_school_address or 'N/A'}</td></tr>
<tr><td class="label">ALS Applicant:</td><td class="value">{'Yes' if application.is_als else 'No'}</td></tr>
</table>

<div class="section-title">VI. EMERGENCY CONTACT</div>
<table>
<tr><td class="label">Name:</td><td class="value">{application.emergency_contact_name}</td></tr>
<tr><td class="label">Relationship:</td><td class="value">{application.emergency_contact_relationship}</td></tr>
<tr><td class="label">Phone Number:</td><td class="value">{application.emergency_contact_phone}</td></tr>
</table>

<div class="section-title">VII. DOCUMENTS SUBMITTED</div>
<table>
<tr><td class="label">Birth Certificate:</td><td class="value">{'Submitted' if application.birth_certificate else 'Not submitted'}</td></tr>
<tr><td class="label">Report Card:</td><td class="value">{'Submitted' if application.report_card else 'Not submitted'}</td></tr>
<tr><td class="label">Good Moral Certificate:</td><td class="value">{'Submitted' if application.good_moral_certificate else 'Not submitted'}</td></tr>
<tr><td class="label">ID Picture:</td><td class="value">{'Submitted' if application.id_picture else 'Not submitted'}</td></tr>
</table>

<div class="signature-area">
    <div class="signature-block">
        <div class="signature-line">Applicant's Signature</div>
    </div>
    <div class="signature-block">
        <div class="signature-line">Parent / Guardian Signature</div>
    </div>
</div>

<div class="footer">
    <p>This document was generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}</p>
    <p>{SCHOOL_NAME} — Enrollment Management System</p>
</div>
</body></html>"""

    return html_content


def generate_enrollment_summary_pdf(applications, filters=None):
    """Generate a summary report PDF for multiple applications."""
    filter_desc = ""
    if filters:
        parts = []
        if filters.get('status'):
            parts.append(f"Status: {filters['status'].replace('_', ' ').title()}")
        if filters.get('grade_level'):
            parts.append(f"Grade: {filters['grade_level']}")
        if filters.get('school_year'):
            parts.append(f"SY: {filters['school_year']}")
        filter_desc = " | ".join(parts) if parts else "All Applications"

    rows = ""
    for i, app in enumerate(applications, 1):
        status_label, status_class = STATUS_MAP.get(app.status, ('Unknown', ''))
        rows += f"""<tr>
            <td>{i}</td>
            <td>{app.enrollment_number or '—'}</td>
            <td>{app.last_name}, {app.first_name}</td>
            <td>Grade {app.grade_level}</td>
            <td>{app.get_enrollment_type_display()}</td>
            <td><span class="badge {status_class}">{status_label}</span></td>
            <td>{app.submitted_at.strftime('%m/%d/%Y') if app.submitted_at else '—'}</td>
        </tr>"""

    html_content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>{_base_css()}
    table.summary {{ font-size: 9pt; }}
    table.summary td {{ padding: 3px 6px; }}
    th {{ background: #2D1B4D; color: white; padding: 5px 6px; text-align: left; font-size: 9pt; }}
</style>
</head><body>
<div class="header">
    <h1>{SCHOOL_NAME}</h1>
    <h2>ENROLLMENT APPLICATIONS SUMMARY</h2>
    <p>Generated: {timezone.now().strftime('%B %d, %Y')} | Filter: {filter_desc}</p>
</div>

<table class="summary">
<tr>
    <th>#</th><th>Enrollment #</th><th>Applicant</th><th>Grade</th>
    <th>Type</th><th>Status</th><th>Date</th>
</tr>
{rows}
</table>

<p style="margin-top: 15px; font-size: 10pt; color: #555;">
    Total Applications: <strong>{len(applications)}</strong>
</p>

<div class="footer">
    <p>{SCHOOL_NAME} — Enrollment Management System</p>
</div>
</body></html>"""

    return html_content


def render_to_pdf_response(html_content, filename):
    """Convert HTML to PDF and return as HttpResponse, or return HTML fallback."""
    if HAS_PDF:
        buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.StringIO(html_content), dest=buffer)
        if not pisa_status.err:
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

    # Fallback: return HTML as downloadable file
    response = HttpResponse(html_content, content_type='text/html')
    response['Content-Disposition'] = f'attachment; filename="{filename.replace(".pdf", ".html")}"'
    return response


def enrollment_form_response(application):
    """Generate and return enrollment form PDF response."""
    html = generate_enrollment_form_pdf(application)
    filename = f"enrollment_form_{application.enrollment_number}.pdf"
    return render_to_pdf_response(html, filename)


def enrollment_summary_response(applications, filters=None):
    """Generate and return enrollment summary PDF response."""
    html = generate_enrollment_summary_pdf(applications, filters)
    filename = f"enrollment_summary_{timezone.now().strftime('%Y%m%d')}.pdf"
    return render_to_pdf_response(html, filename)
