import PortalHubShell from '../components/PortalHubShell';
import AuditLogs from './AuditLogs';
import Backups from './Backups';
import WebsiteContentManagement from './WebsiteContentManagement';
import Moderation from './Moderation';
import SystemHealth from './SystemHealth';

const tabs = [
  { id: 'audit-logs', label: 'Audit Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', component: AuditLogs, roles: ['admin'] },
  { id: 'backups', label: 'Backups', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', component: Backups, roles: ['admin'] },
  { id: 'website-editor', label: 'Website Editor', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', component: WebsiteContentManagement, roles: ['admin'] },
  { id: 'moderation', label: 'Moderation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', component: Moderation, roles: ['admin'] },
  { id: 'system-health', label: 'System Health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', component: SystemHealth, roles: ['admin'] },
];

const SystemAdminHub = () => (
  <PortalHubShell
    title="System Admin Hub"
    description="Audit, recovery, website operations, moderation, and system monitoring."
    tabs={tabs}
    showHeader={false}
  />
);

export default SystemAdminHub;
