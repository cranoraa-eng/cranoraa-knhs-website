import PortalHubShell from '../components/PortalHubShell';
import AuditLogs from './AuditLogs';
import Backups from './Backups';
import WebsiteContentManagement from './WebsiteContentManagement';
import Moderation from './Moderation';
import SystemHealth from './SystemHealth';

const tabs = [
  { id: 'audit-logs', label: 'Audit Logs', component: AuditLogs, roles: ['admin'] },
  { id: 'backups', label: 'Backups', component: Backups, roles: ['admin'] },
  { id: 'website-editor', label: 'Website Editor', component: WebsiteContentManagement, roles: ['admin'] },
  { id: 'moderation', label: 'Moderation', component: Moderation, roles: ['admin'] },
  { id: 'system-health', label: 'System Health', component: SystemHealth, roles: ['admin'] },
];

const SystemAdminHub = () => (
  <PortalHubShell
    title="System Admin Hub"
    description="Combines audit, recovery, website operations, moderation, and system monitoring into one admin console."
    tabs={tabs}
  />
);

export default SystemAdminHub;
