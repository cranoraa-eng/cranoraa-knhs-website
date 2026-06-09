import PortalHubShell from '../components/PortalHubShell';
import Announcements from './Announcements';
import Messages from './Messages';

const tabs = [
  { id: 'bulletins', label: 'Bulletins', component: Announcements, roles: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'inbox', label: 'Inbox', component: Messages, roles: ['admin', 'teacher', 'student'] },
];

const CommunicationCenter = () => (
  <PortalHubShell
    title="Communication Center"
    description="Unifies school bulletins and direct messaging so users do not have to jump between separate communication pages."
    tabs={tabs}
  />
);

export default CommunicationCenter;
