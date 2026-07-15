import PortalHubShell from '../components/PortalHubShell';
import Subjects from './Subjects';
import ScheduleManagement from './ScheduleManagement';
import Materials from './Materials';
import ClassroomHub from './ClassroomHub';
import MySchedule from './MySchedule';

const tabs = [
  { id: 'subjects', label: 'Subjects', component: Subjects, roles: ['admin'] },
  { id: 'schedules', label: 'Schedules', component: ScheduleManagement, roles: ['admin'] },
  { id: 'materials', label: 'Materials', component: Materials, roles: ['admin', 'staff', 'student'] },
  { id: 'classes', label: 'My Classes', component: ClassroomHub, roles: ['staff', 'student'] },
  { id: 'schedule', label: 'My Schedule', component: MySchedule, roles: ['staff', 'student'] },
];

const AcademicsHub = () => (
  <PortalHubShell
    title="Academics Hub"
    description="Centralizes curriculum setup, schedules, class assignments, and learning resources in one workspace."
    tabs={tabs}
    showHeader={false}
  />
);

export default AcademicsHub;
