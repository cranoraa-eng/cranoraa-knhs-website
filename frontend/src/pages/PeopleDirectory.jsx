import PortalHubShell from '../components/PortalHubShell';
import Teachers from './Teachers';
import StudentManagement from './StudentManagement';
import ParentManagement from './ParentManagement';

const tabs = [
  { id: 'teachers', label: 'Teachers', component: Teachers, roles: ['admin'] },
  { id: 'students', label: 'Students', component: StudentManagement, roles: ['admin', 'teacher'], show: (user) => user?.role === 'admin' || user?.is_adviser },
  { id: 'parents', label: 'Parents', component: ParentManagement, roles: ['admin'] },
];

const PeopleDirectory = () => (
  <PortalHubShell
    title="People Directory"
    description="Keeps teacher, student, and parent records together so account management stays in one place."
    tabs={tabs}
  />
);

export default PeopleDirectory;
