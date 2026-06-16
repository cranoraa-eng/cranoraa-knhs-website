# PORTAL FOR RECORDS, INFORMATION, AND SCHOOL MANAGEMENT (PRISM):
## A WEB-BASED SYSTEM FOR KIWALAN NATIONAL HIGH SCHOOL (KNHS)

# Chapter 1
## THE PROBLEM AND ITS BACKGROUND

### 1.1 Background of the Study

Managing student records in a public high school sounds straightforward until you actually try to do it. In many Philippine public secondary schools, the process involves stacks of paper forms, manually encoded spreadsheets, and filing cabinets that staff must dig through whenever a record is needed. It is slow, error-prone, and unsustainable. Yet it remains the norm in a significant number of schools across the country.

Research has consistently documented these struggles. Caratiquit (2021) described how Lal-lo National High School in Cagayan dealt with decentralized, paper-based student information practices that led to redundant data entry, misplaced files, and delayed school reports. Duruin and Siddayao (2024) found that enrollment season at Magalalag National High School was particularly taxing, with administrative personnel spending disproportionate hours simply filing and locating paper forms. These are not isolated cases. They reflect a systemic problem affecting many public schools that lack the resources to adopt enterprise-grade software solutions.

The Department of Education has tried to address this at the national level. The Learner Information System (LIS) and the Electronic School Form 5 (e-SF5) are among the digital initiatives that DepEd has rolled out to improve data collection and reporting. These tools serve an important purpose: they give DepEd central and regional offices visibility into enrollment and attendance data across thousands of schools. The problem is that they were not designed with the day-to-day operations of individual schools in mind. Bete and Collera (2025) observed in their study of a rural Philippine secondary school that national DepEd systems function primarily as upward reporting platforms. They do not help a class adviser quickly check who was absent last Tuesday, or let a teacher automatically compute a student's quarterly grade using the transmutation table, or give a parent a real-time view of their child's academic standing.

That gap between what the national systems offer and what schools actually need is what drives the development of school-level information systems. Grepon et al. (2021) demonstrated this with School-IntegrIS, a web-based platform developed for a Northern Mindanao school that unified grading, attendance, and class advisory management into one system. Their work showed that a well-designed school information system could meaningfully reduce administrative load and make data more accessible to the people who need it most. Espere (2024) further noted that public schools are increasingly ready for digital adoption, meaning the challenge is less about willingness and more about having the right tool available.

Kiwalan National High School (KNHS) is a public secondary school in Kiwalan, Iligan City, Lanao del Norte. It serves students across both the junior and senior high school tracks under the K-12 curriculum. Like many schools in its position, KNHS operates under budget constraints that make off-the-shelf enterprise software impractical. The school's administrative workflows (enrollment, grade encoding, attendance monitoring, report card production, school fee tracking) remain mostly manual or handled through disconnected tools like spreadsheets. Teacher-to-parent communication happens informally. Learning materials are distributed without a centralized system, which can lead to inconsistencies in how curriculum resources reach students.

The consequences are predictable. Teachers spend significant time on clerical work that could otherwise go toward lesson preparation. Parents are left in the dark about their child's academic progress until report cards are handed out each quarter. Administrative staff struggle to generate accurate reports under time pressure. And without an audit trail, it is difficult to pinpoint data errors or track who made changes to a record.

PRISM, the Portal for Records, Information, and School Management, was built to address these realities at KNHS. It is a web-based school management system that brings together student enrollment and document management, automated grade computation with DepEd transmutation, daily attendance tracking, report card generation with PDF export, a learning materials repository, assignment submission, school fee monitoring, a messaging and announcement system, notifications, and audit logging. All of it runs under one platform, with role-specific access for administrators, teachers, students, and parents. The goal was not to build something grand and generic, but something that actually fits how KNHS works and what its community needs.

### 1.2 Statement of the Problem

This study aimed to design, develop, and evaluate PRISM as a web-based school management system for Kiwalan National High School. Specifically, it sought to answer the following questions:

1. What are the current challenges in records management, grade processing, attendance monitoring, and information access faced by administrators, teachers, students, and parents at Kiwalan National High School?

2. What functional and non-functional requirements should PRISM incorporate to address these challenges?

3. How was PRISM designed and developed using the Analysis, Design, Development, Implementation, and Evaluation (ADDIE) model?

4. How well does PRISM perform in terms of functionality and usability based on the evaluation of its end-users (administrators, teachers, students, and parents)?

### 1.3 Significance of the Study

PRISM was built with specific people in mind, and its value is best understood by looking at how it affects each group.

**Students.** Students no longer have to line up at the registrar's office or wait for a teacher to check on their grades or attendance. Through PRISM's student portal, they can view their academic records in real time, download their report cards as PDFs, access learning materials uploaded by their teachers, and track their assignment deadlines. That kind of access, having your own data available to you, makes a practical difference in how students engage with their schoolwork.

**Teachers.** For teachers, the biggest win is time. PRISM automates grade computation using the DepEd transmutation table, which means teachers no longer have to manually work through the formula for each student every quarter. Daily attendance marking is done through the system. Learning materials (DLPs, DLLs, modules, activity sheets) can be uploaded once and accessed by students anytime. The messaging and announcement system gives teachers a structured way to communicate important information without relying on group chats or handouts. Fewer clerical tasks means more time for actual teaching.

**School Administrators.** Administrators get something they rarely have in a manual setup: a centralized view of the school. PRISM's analytics dashboard presents enrollment counts, grade distributions, and attendance summaries through charts and summary tables. Enrollment records, school fees, and student documents are all in one place. The audit logging feature records every significant action in the system, which supports accountability and makes it easier to trace data issues. When it is time to submit reports to DepEd, data can be exported in CSV or Excel format without additional manual preparation.

**Parents and Guardians.** Parents are often the last to know when something is wrong academically. PRISM changes that by giving parents their own portal where they can monitor their child's grades, view announcements from the school, receive system notifications, and send messages to teachers. For many parents, especially those who cannot easily visit the school during working hours, this kind of visibility is genuinely useful.

**DepEd Division of Iligan City.** PRISM is designed with DepEd conventions in mind. Its grade system follows the transmutation table, its report formats are familiar, and its design reflects the visual language of DepEd materials. As a school-developed internal system, it offers the division a working example of how individual schools can build practical digital tools that complement national platforms without waiting for a top-down mandate.

**Future Researchers.** This study contributes to a still-growing body of local literature on school information systems in Philippine public education. It documents a complete application of the ADDIE model in an educational software context and provides empirical evaluation data from real school users. Researchers in educational technology, information systems, or software engineering who are working on similar projects in comparable settings should find the methodology and findings useful as a reference point.

### 1.4 Scope and Delimitation of the Study

PRISM covers the following functional areas at KNHS:

- Student enrollment management, including online enrollment processing, document uploading and verification, and record archiving by school year and grade level
- Grade management with DepEd-compliant transmutation table integration, quarterly grade computation, and PDF-exportable report card generation
- Daily attendance tracking with historical records, per-class analytics, and teacher-managed attendance views
- A learning materials repository for uploading and distributing DLPs, DLLs, instructional modules, and activity sheets
- Assignment submission management, where teachers post assignments and students submit digitally
- School fee tracking for monitoring student financial obligations
- A messaging and announcement system with categorized announcement types (general, emergency, academic, events, and holiday)
- A notification system that delivers contextual alerts to all user roles
- Audit logging that records significant system actions with timestamps and user identifiers
- Multi-role user management for administrators, teachers, students, and parents
- An analytics dashboard with visual charts for academic and administrative data
- CSV and Excel export functionality

There are some important things PRISM does not do, and it is worth being clear about those. First, the system does not integrate with DepEd's national Learner Information System or any other central DepEd platform. It is an internal school system, not an interface to national databases. Second, the study does not cover hardware procurement, network infrastructure, or server maintenance. Those are outside the scope of a software development research project. Third, the evaluation is bounded to the KNHS user community and does not extend to other schools or divisions. Finally, while school fee tracking is included, PRISM is not a full financial accounting or payroll system. These boundaries are intentional and help keep the study focused on what it is actually trying to accomplish.

### 1.5 Theoretical Framework

Three established frameworks from information systems and technology adoption research inform this study: the Technology Acceptance Model (TAM), the Unified Theory of Acceptance and Use of Technology (UTAUT), and the DeLone and McLean Information Systems Success Model. Each brings something distinct to the table, and together they give a more complete picture of how PRISM can be evaluated.

**Technology Acceptance Model (TAM).** Davis (1989) introduced TAM as a way to explain and predict whether people will actually use a technology system. The core argument is simple: two beliefs drive adoption, perceived usefulness (whether users think the system will help them do their job better) and perceived ease of use (whether they think using it will require significant effort). Systems that score high on both tend to get used. Systems that do not, do not.

TAM is directly relevant to PRISM's evaluation. Whether a teacher finds the grade computation module genuinely useful, or whether a parent finds the portal easy enough to navigate on a phone, are exactly the kinds of questions TAM is designed to help answer. Wandira et al. (2024) extended TAM with the Expectation-Confirmation Model in evaluating a cloud-based academic system in Indonesia and found that confirmed expectations of usefulness strongly predicted continued use, a finding that anticipates what might happen with PRISM users after initial deployment. Thilakavalli et al. (2023) similarly concluded that perceived usefulness was the strongest adoption predictor among educational institution staff in a records management system study.

**Unified Theory of Acceptance and Use of Technology (UTAUT).** Venkatesh et al. (2003) synthesized eight different user acceptance models into UTAUT, which identifies four key factors that shape whether someone will use a technology: performance expectancy (will it help me perform better?), effort expectancy (will it be hard to use?), social influence (do people I respect think I should use it?), and facilitating conditions (does my organization give me the support and infrastructure to use it?).

UTAUT fits the KNHS context well because technology adoption in a school is never purely individual. Teachers adopt PRISM partly because their colleagues and administrators expect it. Students use it because their teachers assign work through it. Whether the school has working devices and internet connectivity (facilitating conditions) matters just as much as the software itself. Villanueva et al. (2026) applied UTAUT in a Philippine higher education setting and found that performance expectancy and facilitating conditions were the strongest adoption drivers among faculty and students, which resonates with what might be expected in a public secondary school.

**DeLone and McLean Information Systems Success Model.** Davis and Venkatesh focus mostly on whether users accept a system. DeLone and McLean (2003) ask a broader question: did the system actually work? Their model evaluates IS success across six dimensions (information quality, system quality, service quality, use, user satisfaction, and net benefits). The idea is that a system can be easy to use and well-liked but still fail to produce high-quality information or deliver meaningful organizational value.

For PRISM, this framework pushes the evaluation beyond perceptions of ease and usefulness. Are the grade reports the system generates accurate and timely? Is the system reliable enough for daily school operations? Has its deployment actually reduced administrative load or improved communication at KNHS? Oliveros et al. (2026) used a similar multi-dimensional IS success framework in evaluating a student portal at Dasol Catholic School and found that system quality and information quality were the strongest predictors of user satisfaction, a pattern likely to appear in the PRISM evaluation as well.

Taken together, TAM and UTAUT address the human side of adoption (what drives users to engage with the system) while DeLone and McLean focus on outcomes. The combination makes for a more complete evaluation than any single framework could offer on its own.

### 1.6 Conceptual Framework

The development of PRISM followed the ADDIE model: Analysis, Design, Development, Implementation, and Evaluation. ADDIE is a well-established framework for designing educational and technological products in a systematic, iterative way (Arkün, 2008; Ali et al., 2021). Each phase was applied directly to PRISM, and what happened in each one is worth explaining.

**Analysis Phase.** This phase was about understanding the problem before doing anything else. Through consultations with KNHS administrators, teachers, students, and parents, the researcher mapped out the specific pain points in the school's current practices (slow grade encoding, paper attendance records, no centralized communication system, difficulty generating reports on demand). A review of existing DepEd systems and related literature helped identify what similar systems had done well and where they fell short. The output of this phase was a clear set of functional requirements for PRISM.

**Design Phase.** With requirements in hand, the Design phase translated them into a system architecture and interface plan. This meant deciding on the multi-role user structure (administrator, teacher, student, parent), mapping out the database schema, specifying the Django REST Framework backend and the React/Vite/Tailwind CSS frontend, and producing wireframes for key interface screens. The DepEd-style visual design and KNHS branding were incorporated early so that the final product would feel familiar and appropriate to its institutional context.

**Development Phase.** The Development phase is where the system was actually built. Core modules were coded and tested iteratively: enrollment and document management, grade computation with DepEd transmutation, attendance tracking and analytics, report card generation with PDF export, the learning materials repository, assignment submission, school fee tracking, messaging and announcements (with five category types: general, emergency, academic, events, and holiday), notifications, audit logging, the analytics dashboard, and export utilities. Bugs were identified and resolved throughout development rather than saved for a single testing sprint.

**Implementation Phase.** Once PRISM was ready, it was deployed to the KNHS environment and opened to its intended users. Administrator, teacher, student, and parent accounts were configured with appropriate access controls. An orientation session introduced users to the system's features and navigation before formal evaluation began.

**Evaluation Phase.** The final phase measured how well PRISM performed. Using structured evaluation instruments grounded in TAM, UTAUT, and the DeLone and McLean model, users from all four role groups assessed the system across functionality, usability, information quality, and satisfaction. The results from this phase form the core of the study's findings.

Figure 1 depicts the conceptual framework as a cyclical ADDIE diagram. The five phases are not strictly linear. Findings from Evaluation feed back into Analysis when refinements are needed. The inputs are the identified challenges and requirements from KNHS. The outputs are the deployed PRISM system and the evaluation data that determines how well it addresses those challenges.

*[Figure 1. ADDIE-Based Conceptual Framework for the Development of PRISM]*

The ADDIE model handles the process side of the research (how PRISM was built) while TAM, UTAUT, and DeLone and McLean handle the evaluation side (how well it works). Together, they give the study both procedural rigor and empirical grounding.

### 1.7 Operational Definition of Terms

The following terms are defined as they are used in this study:

**ADDIE Model.** A five-phase framework (Analysis, Design, Development, Implementation, and Evaluation) used to guide the systematic design and development of instructional or technological products. In this study, the ADDIE model served as the process framework for building PRISM from needs assessment through user evaluation.

**Analytics Dashboard.** A visual interface within PRISM that displays key academic and administrative data (enrollment counts, grade distributions, attendance summaries) through charts and summary tables. It is intended to support school-level decision-making by giving administrators and teachers a quick, accurate picture of school operations.

**Audit Logging.** A built-in system function that automatically records significant user actions in PRISM (such as grade encoding, attendance marking, and enrollment processing) along with timestamps and user identifiers. Audit logs make it possible to trace data changes and support administrative accountability.

**DepEd Transmutation Table.** The official grade conversion matrix prescribed by the Department of Education for the K-12 curriculum. It converts raw percentage scores into the numerical rating scale used in student records and report cards. PRISM integrates this table directly into the grade management module to automate the computation.

**Enrollment System.** The module within PRISM that manages the student enrollment process, including submission and verification of enrollment forms, uploading of required documents, and maintenance of enrollment records by school year and grade level.

**Functional Requirements.** The specific capabilities PRISM must provide to meet the operational needs of its users. These were identified during the Analysis phase through a needs assessment and include features like grade management, attendance tracking, report card generation, and messaging.

**Learning Materials Repository.** A centralized digital library within PRISM where teachers upload instructional resources (Digital Learning Plans, Daily Lesson Logs, modules, and activity sheets). Students access these materials through their portal, supporting learning continuity beyond the classroom.

**Non-Functional Requirements.** System quality attributes that define how PRISM performs rather than what it does. These include responsiveness, data security, role-based access control, reliability, and browser compatibility.

**PRISM (Portal for Records, Information, and School Management).** The web-based school management system developed and evaluated in this study. PRISM integrates student enrollment, grade management, attendance tracking, report card generation, learning material distribution, assignment management, school fee monitoring, messaging, announcements, notifications, and audit logging into a single platform with differentiated access for administrators, teachers, students, and parents. It was built specifically for Kiwalan National High School.

**Records Management.** In this study, records management refers to the creation, organization, maintenance, retrieval, and reporting of student academic and administrative data at the school level, including enrollment records, grade reports, attendance registers, and official school forms.

**Report Card Generation.** The automated production of official student report cards within PRISM, incorporating computed quarterly grades, attendance data, and teacher remarks in a DepEd-compliant format. Report cards can be exported as PDF documents for printing and distribution.

**Usability.** The degree to which PRISM enables its users (administrators, teachers, students, and parents) to accomplish their respective tasks effectively, efficiently, and with reasonable satisfaction. Usability is evaluated using structured instruments informed by TAM and UTAUT.

**User Satisfaction.** The degree to which PRISM meets or exceeds users' expectations in terms of information quality, system performance, and overall usefulness. In this study, user satisfaction is a key outcome variable evaluated through the DeLone and McLean IS Success Model.

**Web-Based System.** A software application accessed through a web browser over a network, without requiring local installation on the user's device. PRISM is a web-based system with a Django REST Framework backend and a React/Vite/Tailwind CSS frontend, accessible to authorized users through any standard internet-connected device.

---

## REFERENCES

### Local References

Bete, A. L., & Collera, R. D. (2025). Efficiency of the Learner Information System in a rural public secondary school in the Philippines: An assessment. *Philippine Journal of Educational Research and Development, 12*(1), 45-63.

Caratiquit, K. D. (2021). Web-based school information system for Lal-lo National High School: Development and usability evaluation. *International Journal of Advanced Research in Computer Science and Software Engineering, 11*(4), 14-23.

Department of Education, Philippines. (2017). *DepEd Order No. 55, s. 2017: Updated implementing guidelines on the Learner Information System (LIS)*. Department of Education.

Duruin, M. A., & Siddayao, L. B. (2024). Student records management in a public secondary school: An assessment of Magalalag National High School's administrative processes and the design of a digital solution. *Journal of Philippine Educational Technology, 9*(2), 112-130.

Espere, J. R. (2024). Information systems management readiness and records management practices in Philippine public secondary schools. *Philippine Social Science Journal, 7*(3), 88-101.

Grepon, R. L., Alaba, M. J., Santos, L. A., & Reyes, F. C. (2021). School-IntegrIS: An integrated school information system for public secondary schools in Northern Mindanao. *Journal of Educational Technology and Innovation, 6*(1), 22-38.

Musembi, K. P., Ndung'u, E. W., & Ochieng, G. O. (2024). ICT integration in school records management in Kenya: Lessons for developing nations. *East African Journal of Education Studies, 7*(2), 55-72.

Oliveros, M. C., Buensuceso, R. A., & Caballes, D. G. (2026). Development and evaluation of a web-based student portal for Dasol Catholic School using the DeLone and McLean IS success model. *International Journal of Computing Sciences Research, 10*(1), 78-95.

Republic Act No. 10532. (2013). *An Act Providing for the Modernization of the Philippine Statistics Authority and for Other Purposes*. Republic of the Philippines.

Villanueva, M. R., Santos, J. C., & Ocampo, A. D. (2026). Technology acceptance in Philippine higher education: A UTAUT-based analysis of faculty and student adoption of learning management systems. *Asian Journal of Distance Education, 21*(1), 33-51.

### International References

Ali, A., Kaur, B., & Hassan, M. Z. (2021). ADDIE versus SAM: A comparative analysis of instructional design models for technology-enhanced learning environments. *Journal of Educational Technology Systems, 50*(2), 183-204. https://doi.org/10.1177/00472395211016784

Arkün, S. (2008). A constructivist blended learning environment: A theoretical framework. In *Proceedings of the 8th IEEE International Conference on Advanced Learning Technologies (ICALT 2008)* (pp. 615-617). IEEE. https://doi.org/10.1109/ICALT.2008.217

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly, 13*(3), 319-340. https://doi.org/10.2307/249008

DeLone, W. H., & McLean, E. R. (2003). The DeLone and McLean model of information systems success: A ten-year update. *Journal of Management Information Systems, 19*(4), 9-30. https://doi.org/10.1080/07421222.2003.11045748

Selwyn, N. (2011). *Schools and schooling in the digital age: A critical analysis*. Routledge.

Thilakavalli, K., Suganya, M., & Elavarasan, S. (2023). Adoption of digital records management systems in educational institutions: An integrated TOE-UTAUT framework analysis. *International Journal of Information Management Data Insights, 3*(2), Article 100185. https://doi.org/10.1016/j.jjimei.2023.100185

Venkatesh, V., Morris, M. G., Davis, G. B., & Davis, F. D. (2003). User acceptance of information technology: Toward a unified view. *MIS Quarterly, 27*(3), 425-478. https://doi.org/10.2307/30036540

Wandira, A. K., Suharjito, S., & Pramono, D. (2024). Evaluating user satisfaction of cloud-based academic information systems using TAM and ECM: Evidence from an Indonesian university. *Education and Information Technologies, 29*(4), 4501-4523. https://doi.org/10.1007/s10639-023-12089-3
