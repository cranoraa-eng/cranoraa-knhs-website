import PortalHubShell from '../components/PortalHubShell';
import GradeInput from './GradeInput';
import GradeManagement from './GradeManagement';
import Analytics from './Analytics';
import StudentGradeView from './StudentGradeView';

const tabs = [
  { id: 'grade-input', label: 'Grade Input', component: GradeInput, roles: ['admin', 'staff'] },
  { id: 'grade-management', label: 'Grade Management', component: GradeManagement, roles: ['admin', 'staff'] },
  { id: 'grade-analytics', label: 'Grade Analytics', component: Analytics, roles: ['admin', 'staff'] },
  { id: 'my-grades', label: 'My Grades', component: StudentGradeView, roles: ['student'] },
];

const GradingSuite = () => (
  <PortalHubShell
    title="Grading Suite"
    description="Groups grade entry, review, and academic performance analysis into one grading workflow."
    tabs={tabs}
    showHeader={false}
  />
);

export default GradingSuite;
