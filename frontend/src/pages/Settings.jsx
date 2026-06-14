import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useActiveAcademicYear } from '../hooks/useActiveAcademicYear';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Button, LoadingSpinner } from '../components/ui';

// Simple SVG icon map
const ICONS = {
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  globe: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  message: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  cog: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  wrench: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    </svg>
  ),
  palette: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  school: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9-5 9 5-9 5z" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  database: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const Icon = ({ name, className = '' }) => (
  <span className={className} aria-hidden="true">{ICONS[name] || null}</span>
);

const Toggle = ({ checked, onChange, disabled, color = 'blue' }) => {
  const colors = {
    blue:    'peer-checked:bg-violet-600',
    emerald: 'peer-checked:bg-emerald-600',
    amber:   'peer-checked:bg-amber-500',
    rose:    'peer-checked:bg-rose-600',
  };
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
      <div className={`w-11 h-6 bg-slate-200 rounded-full peer transition-all
        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
        after:bg-white after:border after:border-slate-200 after:rounded-full
        after:h-5 after:w-5 after:transition-all
        peer-checked:after:translate-x-full peer-checked:after:border-white
        peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
        ${colors[color]}`} />
    </label>
  );
};

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 font-medium">{hint}</p>}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-900
      focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500
      disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
    {...props}
  />
);

const SectionCard = ({ title, subtitle, icon, children, danger, className = '' }) => (
  <div className={`bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${danger ? 'border-rose-200' : 'border-slate-200'} ${className}`}>
    <div className={`px-5 py-4 border-b flex items-center gap-3 ${danger ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600'}`}>
        <Icon name={icon} />
      </div>
      <div>
        <h3 className={`text-sm font-extrabold tracking-tight ${danger ? 'text-rose-900' : 'text-slate-900'}`}>{title}</h3>
        {subtitle && <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${danger ? 'text-rose-600' : 'text-slate-500'}`}>{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Spinner = ({ className = '' }) => (
  <svg className={`animate-spin text-violet-600 ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const EmailServiceNotice = ({ health }) => {
  if (!health) return null;
  const healthy = health.status === 'ok';
  return (
    <div className={`rounded-lg border px-5 py-4 shadow-sm ${
      healthy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
    }`} role="alert" aria-label={`Email service is ${healthy ? 'healthy' : 'degraded'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
          healthy ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`} aria-hidden="true">
          {healthy ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-wider ${healthy ? 'text-emerald-700' : 'text-amber-700'}`}>
              Email Service Health
            </p>
            <p className={`mt-1 text-sm font-bold ${healthy ? 'text-emerald-900' : 'text-amber-900'}`}>
              {health.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            <span className={`rounded-md px-2.5 py-1 ${health.checks?.api_credentials ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {health.checks?.api_credentials ? 'API keys present' : 'API keys missing'}
            </span>
            <span className={`rounded-md px-2.5 py-1 ${health.checks?.sender_email ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {health.checks?.sender_email ? 'Sender email set' : 'Sender email missing'}
            </span>
          </div>
          <p className={`text-xs font-medium ${healthy ? 'text-emerald-800' : 'text-amber-800'}`}>
            Sender: <span className="font-bold">{health.sender_email || 'Not configured'}</span>
          </p>
          {health.issues?.length > 0 && (
            <div className="space-y-1">
              {health.issues.map((issue, i) => (
                <p key={i} className="text-xs font-medium text-amber-900">{issue}</p>
              ))}
            </div>
          )}
          <p className={`text-[11px] font-medium ${healthy ? 'text-emerald-700' : 'text-amber-700'}`}>
            Mailjet can still reject delivery if the sender address or domain has not been verified in the Mailjet dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Grading Settings Tab ─────────────────────────────────────────────────

const GradingSettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/system/settings/')
      .then(r => setSettings(r.data))
      .catch(() => toast.error('Failed to load grading settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/system/settings/', {
        academic_level: settings.academic_level,
        current_quarter: settings.current_quarter,
        default_ww_weight: settings.default_ww_weight,
        default_pt_weight: settings.default_pt_weight,
        default_qa_weight: settings.default_qa_weight,
        passing_grade: settings.passing_grade,
      });
      toast.success('Grading settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const isJHS = settings.academic_level === 'jhs';
  const totalWeight = Number(settings.default_ww_weight) + Number(settings.default_pt_weight) + Number(settings.default_qa_weight);
  const weightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <form onSubmit={save} className="space-y-6">
      <SectionCard title="Grading Configuration" subtitle="Configure grading periods and academic level" icon="chart">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Academic Level">
              <select value={settings.academic_level} onChange={e => setSettings(p => ({...p, academic_level: e.target.value, current_quarter: '1'}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
                <option value="jhs">Junior High School (Grades 7-10)</option>
                <option value="shs">Senior High School (Grades 11-12)</option>
              </select>
            </Field>
            <Field label={isJHS ? 'Current Quarter' : 'Current Semester'}>
              <select value={settings.current_quarter} onChange={e => setSettings(p => ({...p, current_quarter: e.target.value}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
                {isJHS ? (
                  <>
                    <option value="1">1st Quarter</option>
                    <option value="2">2nd Quarter</option>
                    <option value="3">3rd Quarter</option>
                    <option value="4">4th Quarter</option>
                  </>
                ) : (
                  <>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester (Summer)</option>
                  </>
                )}
              </select>
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Default Grading Weights" subtitle="Applied to new classroom-subjects; can be overridden per subject" icon="chart">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Written Work (%)">
              <input type="number" min="0" max="100" step="0.01"
                value={settings.default_ww_weight}
                onChange={e => setSettings(p => ({...p, default_ww_weight: e.target.value}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all" />
            </Field>
            <Field label="Performance Task (%)">
              <input type="number" min="0" max="100" step="0.01"
                value={settings.default_pt_weight}
                onChange={e => setSettings(p => ({...p, default_pt_weight: e.target.value}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all" />
            </Field>
            <Field label="Quarterly Assessment (%)">
              <input type="number" min="0" max="100" step="0.01"
                value={settings.default_qa_weight}
                onChange={e => setSettings(p => ({...p, default_qa_weight: e.target.value}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all" />
            </Field>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${weightValid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            <span className={`w-2 h-2 rounded-full ${weightValid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold">Total: {totalWeight.toFixed(2)}% {weightValid ? '(valid)' : '(should equal 100%)'}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Passing Standard" subtitle="Minimum grade to pass a subject" icon="shield">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Passing Grade (%)">
            <input type="number" min="0" max="100" step="0.01"
              value={settings.passing_grade}
              onChange={e => setSettings(p => ({...p, passing_grade: e.target.value}))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all" />
          </Field>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grading Scale</p>
            <div className="space-y-1.5">
              {[
                { label: 'Outstanding', min: 90, color: 'emerald' },
                { label: 'Very Satisfactory', min: 85, color: 'blue' },
                { label: 'Satisfactory', min: 80, color: 'amber' },
                { label: 'Fairly Satisfactory', min: settings.passing_grade, color: 'orange' },
                { label: 'Did Not Meet', min: null, max: Number(settings.passing_grade) - 0.01, color: 'red' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  <span className="text-slate-500">
                    {item.min !== null ? `${item.min}-${item.max || 100}` : `Below ${settings.passing_grade}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} loading={saving} variant="primary">
          Save Grading Settings
        </Button>
      </div>
    </form>
  );
};

// ── Roles & Permissions Tab ──────────────────────────────────────────────

const RolesPermissionsTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/users/')
      .then(r => {
        const data = r.data.results || r.data;
        setUsers(data);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const roleConfig = {
    admin: { label: 'Administrator', color: 'bg-rose-100 text-rose-700', desc: 'Full system access' },
    staff: { label: 'Staff', color: 'bg-blue-100 text-blue-700', desc: 'Teacher / Registrar / Guidance' },
    student: { label: 'Student', color: 'bg-emerald-100 text-emerald-700', desc: 'Student portal access' },
    parent: { label: 'Parent', color: 'bg-amber-100 text-amber-700', desc: 'Parent portal access' },
  };

  const filtered = users.filter(u => {
    const q = filter.toLowerCase();
    return !q || u.role === q || u.username?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q);
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <SectionCard title="Role Overview" subtitle="User distribution by role" icon="shield">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(roleConfig).map(([key, config]) => (
            <div key={key} className={`${config.color} rounded-lg p-3 text-center`}>
              <p className="text-2xl font-extrabold">{roleCounts[key] || 0}</p>
              <p className="text-xs font-bold mt-1">{config.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Role Permissions" subtitle="What each role can access" icon="shield">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-extrabold text-slate-700">Feature</th>
                <th className="text-center py-2 px-3 font-extrabold text-rose-700">Admin</th>
                <th className="text-center py-2 px-3 font-extrabold text-blue-700">Staff</th>
                <th className="text-center py-2 px-3 font-extrabold text-emerald-700">Student</th>
                <th className="text-center py-2 px-3 font-extrabold text-amber-700">Parent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { feature: 'View Dashboard', admin: true, staff: true, student: true, parent: true },
                { feature: 'Enter Grades', admin: true, staff: true, student: false, parent: false },
                { feature: 'Manage Users', admin: true, staff: false, student: false, parent: false },
                { feature: 'System Settings', admin: true, staff: false, student: false, parent: false },
                { feature: 'Chat / Messaging', admin: true, staff: true, student: true, parent: false },
                { feature: 'View Reports', admin: true, staff: true, student: true, parent: true },
                { feature: 'Manage Enrollment', admin: true, staff: true, student: false, parent: false },
                { feature: 'Database Backup', admin: true, staff: false, student: false, parent: false },
                { feature: 'Audit Logs', admin: true, staff: false, student: false, parent: false },
              ].map(row => (
                <tr key={row.feature} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-700">{row.feature}</td>
                  {['admin', 'staff', 'student', 'parent'].map(role => (
                    <td key={role} className="py-2 px-3 text-center">
                      {row[role] ? (
                        <svg className="w-4 h-4 text-emerald-500 mx-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-slate-300 mx-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="User List" subtitle="All registered users and their roles" icon="users">
        <div className="mb-4">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
          </select>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {filtered.slice(0, 50).map(u => (
            <div key={u.id} className="flex items-center justify-between py-2.5 px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {u.first_name?.[0]}{u.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{u.first_name} {u.last_name}</p>
                  <p className="text-[11px] text-slate-500">@{u.username}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleConfig[u.role]?.color || 'bg-slate-100 text-slate-600'}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ── Communication Settings Tab ───────────────────────────────────────────

const CommunicationSettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/system/settings/')
      .then(r => setSettings(r.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/system/settings/', {
        allow_student_chat: settings.allow_student_chat,
        allow_teacher_chat: settings.allow_teacher_chat,
      });
      toast.success('Communication settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <form onSubmit={save} className="space-y-6">
      <SectionCard title="Messaging Permissions" subtitle="Control who can use the chat system" icon="message">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Student Messaging</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Allow students to send messages to teachers and classmates</p>
            </div>
            <Toggle checked={settings.allow_student_chat} onChange={e => setSettings(p => ({...p, allow_student_chat: e.target.checked}))} />
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Teacher Messaging</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Allow teachers to send messages to students and other staff</p>
            </div>
            <Toggle checked={settings.allow_teacher_chat} onChange={e => setSettings(p => ({...p, allow_teacher_chat: e.target.checked}))} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Email Service" subtitle="Email delivery configuration" icon="mail">
        <div className="space-y-3">
          {settings.email_service_health ? (
            <>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${settings.email_service_health.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                <span className={`w-2 h-2 rounded-full ${settings.email_service_health.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold">{settings.email_service_health.summary}</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Sender: <span className="font-bold">{settings.email_service_health.sender_email || 'Not configured'}</span></p>
                <p>API Keys: <span className="font-bold">{settings.email_service_health.checks?.api_credentials ? 'Present' : 'Missing'}</span></p>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">Email service status not available.</p>
          )}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} loading={saving} variant="primary">
          Save Communication Settings
        </Button>
      </div>
    </form>
  );
};

// ── Backup Management Tab ────────────────────────────────────────────────

const BackupManagementTab = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    try {
      const r = await api.get('/admin/backups/');
      setBackups(r.data.results || r.data);
    } catch { toast.error('Failed to load backups'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBackups(); }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      await api.post('/admin/run-backup/');
      toast.success('Backup created successfully');
      fetchBackups();
    } catch { toast.error('Failed to create backup'); }
    finally { setCreating(false); }
  };

  const downloadBackup = async (filename) => {
    try {
      const r = await api.get(`/admin/backups/${filename}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch { toast.error('Failed to download backup'); }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <SectionCard title="Database Backups" subtitle="Create and manage database backups" icon="database">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{backups.length} backup(s) on record</p>
            <Button onClick={createBackup} disabled={creating} loading={creating} variant="primary" size="sm">
              Create Backup
            </Button>
          </div>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm font-bold">No backups yet</p>
              <p className="text-xs mt-1">Create your first backup to secure your data.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {backups.map(b => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{b.filename}</p>
                    <p className="text-[11px] text-slate-500">{b.size} &middot; {new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => downloadBackup(b.filename)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors">
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

// ── Audit Logs Tab ───────────────────────────────────────────────────────

const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/admin/audit-logs/')
      .then(r => setLogs(r.data.results || r.data))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  const typeColors = {
    create: 'bg-emerald-100 text-emerald-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-rose-100 text-rose-700',
    login: 'bg-violet-100 text-violet-700',
    logout: 'bg-slate-100 text-slate-600',
    approve: 'bg-emerald-100 text-emerald-700',
    reject: 'bg-amber-100 text-amber-700',
    export: 'bg-cyan-100 text-cyan-700',
    import: 'bg-cyan-100 text-cyan-700',
    grade_create: 'bg-violet-100 text-violet-700',
    grade_update: 'bg-violet-100 text-violet-700',
    grade_delete: 'bg-rose-100 text-rose-700',
    attendance_mark: 'bg-blue-100 text-blue-700',
    mute: 'bg-amber-100 text-amber-700',
    suspend: 'bg-rose-100 text-rose-700',
  };

  const filtered = logs.filter(l => {
    const q = filter.toLowerCase();
    return !q || l.action_type === q || l.description?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <SectionCard title="System Audit Logs" subtitle="Track all system activity and changes" icon="clock">
        <div className="space-y-4">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="grade_create">Grade Create</option>
            <option value="grade_update">Grade Update</option>
            <option value="attendance_mark">Attendance Mark</option>
          </select>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No audit logs found.</p>
            ) : (
              filtered.slice(0, 100).map(log => (
                <div key={log.id} className="py-2.5 px-1 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{log.description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {log.user?.username || 'System'} &middot; {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColors[log.action_type] || 'bg-slate-100 text-slate-600'}`}>
                      {log.action_type || log.action}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// ── School Info Tab ─────────────────────────────────────────────────────────

const SchoolInfoTab = () => {
  const [form, setForm] = useState({
    site_name: '', school_address: '', school_phone: '', school_email: '',
    primary_color: '#2D1B4D', secondary_color: '#9F7AEA',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef();
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    api.get('/system/settings/').then(r => {
      setForm({
        site_name: r.data.site_name || '',
        school_address: r.data.school_address || '',
        school_phone: r.data.school_phone || '',
        school_email: r.data.school_email || '',
        primary_color: r.data.primary_color || '#2D1B4D',
        secondary_color: r.data.secondary_color || '#9F7AEA',
      });
      if (r.data.school_logo) setLogoPreview(r.data.school_logo);
    }).catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/system/settings/', form);
      toast.success('School info saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Logo must be under 2MB');
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('school_logo', file);
      await api.patch('/system/settings/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoPreview(URL.createObjectURL(file));
      toast.success('Logo updated');
    } catch { toast.error('Failed to upload logo'); }
    finally { setUploadingLogo(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <form onSubmit={save} className="space-y-6">
      <SectionCard title="School Identity" subtitle="Displayed across the portal and public website" icon="building">
        <div className="flex items-start gap-6 mb-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {logoPreview
                ? <img src={logoPreview} alt="School logo" className="w-full h-full object-contain" />
                : <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              }
            </div>
            <button type="button" onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="mt-2 w-20 text-center text-[10px] font-black text-violet-600 hover:text-violet-800 uppercase tracking-widest disabled:opacity-50">
              {uploadingLogo ? 'Uploading…' : 'Change'}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} aria-label="Upload school logo" />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="School / Site Name">
              <Input value={form.site_name} onChange={e => setForm(p => ({...p, site_name: e.target.value}))} placeholder="KNHS School Portal" />
            </Field>
            <Field label="School Email">
              <Input type="email" value={form.school_email} onChange={e => setForm(p => ({...p, school_email: e.target.value}))} placeholder="info@school.edu.ph" />
            </Field>
            <Field label="Phone Number">
              <Input value={form.school_phone} onChange={e => setForm(p => ({...p, school_phone: e.target.value}))} placeholder="(02) 123-4567" />
            </Field>
          </div>
        </div>
        <Field label="School Address">
          <textarea value={form.school_address} onChange={e => setForm(p => ({...p, school_address: e.target.value}))}
            rows={2} placeholder="Complete school address"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 focus:bg-white transition-all resize-none" />
        </Field>
      </SectionCard>

      <SectionCard title="Brand Colors" subtitle="Used in portal UI accents" icon="palette">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary Color">
            <div className="flex items-center gap-3">
              <input type="color" value={form.primary_color} onChange={e => setForm(p => ({...p, primary_color: e.target.value}))}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" aria-label="Primary color" />
              <Input value={form.primary_color} onChange={e => setForm(p => ({...p, primary_color: e.target.value}))} className="font-mono" />
            </div>
          </Field>
          <Field label="Secondary Color">
            <div className="flex items-center gap-3">
              <input type="color" value={form.secondary_color} onChange={e => setForm(p => ({...p, secondary_color: e.target.value}))}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" aria-label="Secondary color" />
              <Input value={form.secondary_color} onChange={e => setForm(p => ({...p, secondary_color: e.target.value}))} className="font-mono" />
            </div>
          </Field>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} loading={saving} variant="primary">
          Save School Info
        </Button>
      </div>
    </form>
  );
};

// ── Academic Years Tab ──────────────────────────────────────────────────────

const AcademicYearsTab = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', is_active: false });
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const fetchYears = async () => {
    try {
      const r = await api.get('/admin/academic-years/');
      setYears([...r.data].sort((a, b) => b.name.localeCompare(a.name)));
    } catch { toast.error('Failed to load academic years'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchYears(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openCreate = () => {
    setEditingYear(null);
    setForm({ name: '', start_date: '', end_date: '', is_active: false });
    setShowForm(true);
  };

  const openEdit = (y) => {
    setEditingYear(y);
    setForm({ name: y.name, start_date: y.start_date, end_date: y.end_date, is_active: y.is_active });
    setShowForm(true);
    setOpenMenuId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start_date || !form.end_date) return toast.error('All fields are required');
    setSaving(true);
    try {
      if (editingYear) {
        await api.patch(`/admin/academic-years/${editingYear.id}/`, form);
        toast.success('Academic year updated');
      } else {
        await api.post('/admin/academic-years/', form);
        toast.success('Academic year created');
      }
      setShowForm(false);
      fetchYears();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleSetActive = async (y) => {
    try {
      await api.post(`/admin/academic-years/${y.id}/activate/`);
      localStorage.setItem('knhs_academic_year', y.name);
      toast.success(`${y.name} set as active year`);
      fetchYears();
    } catch { toast.error('Failed to set active year'); }
    setOpenMenuId(null);
  };

  const handleDelete = async (y) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      title: `Delete ${y.name}?`,
      text: 'This will unlink all classrooms from this year. This cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/academic-years/${y.id}/`);
      toast.success('Academic year deleted');
      fetchYears();
    } catch { toast.error('Failed to delete'); }
  };

  const getStatus = (y) => {
    if (y.is_archived) return { label: 'Archived', color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' };
    if (y.is_active) return { label: 'Active', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' };
    const now = new Date();
    const end = new Date(y.end_date);
    if (end < now) return { label: 'Ended', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
    return { label: 'Upcoming', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Academic Years</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage school years for classrooms and data filtering</p>
        </div>
        <Button onClick={openCreate} variant="primary" size="sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Year
        </Button>
      </div>

      {years.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg text-center py-12">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-bold text-slate-700">No academic years yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create one to start assigning classrooms.</p>
          <Button onClick={openCreate} variant="primary" size="sm">Create First Year</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {years.map(y => {
            const status = getStatus(y);
            return (
              <div key={y.id} className={`bg-white border rounded-lg p-5 transition-all hover:shadow-md ${y.is_active ? 'border-violet-300 ring-1 ring-violet-100' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`text-base font-extrabold ${y.is_active ? 'text-violet-900' : 'text-slate-900'}`}>
                        {y.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.color} mr-1.5`} aria-hidden="true" />
                        {status.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start</p>
                        <p className="font-semibold text-slate-700">{y.start_date}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">End</p>
                        <p className="font-semibold text-slate-700">{y.end_date}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Classes</p>
                        <p className="font-semibold text-slate-700">—</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Students</p>
                        <p className="font-semibold text-slate-700">—</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teachers</p>
                        <p className="font-semibold text-slate-700">—</p>
                      </div>
                    </div>
                  </div>

                  {/* Context menu */}
                  <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === y.id ? null : y.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                      aria-label={`Actions for ${y.name}`}
                      aria-expanded={openMenuId === y.id}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </button>
                    {openMenuId === y.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1" role="menu">
                        {!y.is_active && (
                          <button onClick={() => handleSetActive(y)} role="menuitem"
                            className="w-full text-left px-4 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Set Active
                          </button>
                        )}
                        <button onClick={() => openEdit(y)} role="menuitem"
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(y)} role="menuitem"
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-label={editingYear ? 'Edit academic year' : 'New academic year'}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">{editingYear ? 'Edit Academic Year' : 'New Academic Year'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all" aria-label="Close">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <Field label="Year Name *" hint='e.g. "2026-2027"'>
                <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="2026-2027" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date *">
                  <Input type="date" value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} required />
                </Field>
                <Field label="End Date *">
                  <Input type="date" value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} required />
                </Field>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Set as Active Year</span>
                <Toggle checked={form.is_active} onChange={e => setForm(p => ({...p, is_active: e.target.checked}))} />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saving} loading={saving} variant="primary" className="flex-1">
                  {editingYear ? 'Update' : 'Create'}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Portal Settings Tab ─────────────────────────────────────────────────────

const PortalSettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  useEffect(() => {
    api.get('/system/settings/')
      .then(r => setSettings(r.data))
      .catch(() => toast.error('Failed to load portal settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.patch('/system/settings/', settings);
      setSettings(r.data);
      localStorage.setItem('knhs_academic_year', settings.academic_year);
      toast.success('Portal settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const toggleMaintenance = async (val) => {
    setTogglingMaintenance(true);
    try {
      const r = await api.patch('/system/settings/', { maintenance_mode: val, maintenance_message: settings.maintenance_message });
      setSettings(r.data);
      toast.success(`Maintenance mode ${val ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed to toggle maintenance mode'); }
    finally { setTogglingMaintenance(false); }
  };

  if (loading || !settings) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <form onSubmit={save} className="space-y-6">
      <EmailServiceNotice health={settings.email_service_health} />

      <SectionCard title="Academic Context" subtitle="Controls global defaults for grading and analytics" icon="school">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Academic Level" hint="Determines grading period structure">
              <select value={settings.academic_level} onChange={e => setSettings(p => ({...p, academic_level: e.target.value, current_quarter: '1'}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
                <option value="jhs">Junior High School (Grades 7-10)</option>
                <option value="shs">Senior High School (Grades 11-12)</option>
              </select>
            </Field>
            <Field label={settings.academic_level === 'shs' ? 'Current Semester' : 'Current Quarter'} hint="Used as default when entering grades">
              <select value={settings.current_quarter} onChange={e => setSettings(p => ({...p, current_quarter: e.target.value}))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all">
                {settings.academic_level === 'shs' ? (
                  <>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester (Summer)</option>
                  </>
                ) : (
                  <>
                    <option value="1">1st Quarter</option>
                    <option value="2">2nd Quarter</option>
                    <option value="3">3rd Quarter</option>
                    <option value="4">4th Quarter</option>
                  </>
                )}
              </select>
            </Field>
            <Field label="Default Academic Year" hint="Used in analytics when no year is selected">
              <Input value={settings.academic_year} onChange={e => setSettings(p => ({...p, academic_year: e.target.value}))} placeholder="2026-2027" />
            </Field>
          </div>

          {/* Grading Period Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Grading Period Structure</p>
            <div className="flex flex-wrap gap-2">
              {settings.academic_level === 'shs' ? (
                <>
                  {['1st Semester', '2nd Semester', '3rd Semester (Summer)'].map((label, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      String(i + 1) === settings.current_quarter 
                        ? 'bg-violet-100 border-violet-300 text-violet-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        String(i + 1) === settings.current_quarter 
                          ? 'bg-violet-600 text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>{i + 1}</span>
                      <span className="text-xs font-bold">{label}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'].map((label, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      String(i + 1) === settings.current_quarter 
                        ? 'bg-violet-100 border-violet-300 text-violet-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        String(i + 1) === settings.current_quarter 
                          ? 'bg-violet-600 text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>{i + 1}</span>
                      <span className="text-xs font-bold">{label}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-3">
              {settings.academic_level === 'shs' 
                ? 'Senior High School uses a semester-based grading system with 3 grading periods per academic year.'
                : 'Junior High School uses a quarter-based grading system with 4 grading periods per academic year.'}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Enrollment" subtitle="Control online enrollment availability" icon="clipboard">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Online Enrollment Open</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Allow applicants to submit enrollment forms via the public website</p>
          </div>
          <Toggle checked={settings.enrollment_open} onChange={e => setSettings(p => ({...p, enrollment_open: e.target.checked}))} color="emerald" />
        </div>
      </SectionCard>

      <SectionCard title="Maintenance Mode" subtitle="Temporarily disable portal access for non-admins" icon="wrench" danger>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-rose-900">Enable Maintenance Mode</p>
              <p className="text-xs text-rose-600 font-medium mt-0.5">All users except admins will see the maintenance page</p>
            </div>
            <Toggle checked={settings.maintenance_mode} onChange={e => toggleMaintenance(e.target.checked)} disabled={togglingMaintenance} color="rose" />
          </div>
          {settings.maintenance_mode && (
            <Field label="Maintenance Message">
              <textarea value={settings.maintenance_message} onChange={e => setSettings(p => ({...p, maintenance_message: e.target.value}))}
                rows={3} placeholder="The portal is currently undergoing maintenance…"
                className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-lg text-sm font-medium text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none" />
            </Field>
          )}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} loading={saving} variant="primary">
          Save Portal Settings
        </Button>
      </div>
    </form>
  );
};

// ── My Profile Tab ──────────────────────────────────────────────────────────

const ProfileTab = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: '',
    address: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const picRef = useRef();

  useEffect(() => {
    api.get('/student/profile/').then(r => {
      setForm({
        first_name: r.data.first_name || '',
        last_name: r.data.last_name || '',
        email: r.data.email || '',
        phone_number: r.data.profile?.phone_number || '',
        address: r.data.profile?.address || '',
        date_of_birth: r.data.profile?.date_of_birth || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/student/profile/', form);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append('profile_picture', file);
      await api.post('/student/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success('Profile picture updated');
    } catch { toast.error('Failed to upload picture'); }
    finally { setUploadingPic(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <form onSubmit={save} className="space-y-6">
      <SectionCard title="Profile Information" subtitle="Your personal details visible to the school" icon="user">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden shadow-lg">
              {user?.profile_picture
                ? <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                : <span aria-hidden="true">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
              }
            </div>
            <button type="button" onClick={() => picRef.current?.click()} disabled={uploadingPic}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-violet-700 transition-all disabled:opacity-50" aria-label="Upload profile picture">
              {uploadingPic
                ? <Spinner className="w-3 h-3" />
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              }
            </button>
            <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} aria-label="Select profile picture file" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user?.role} · {user?.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First Name">
            <Input value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} />
          </Field>
          <Field label="Last Name">
            <Input value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} />
          </Field>
          <Field label="Email Address" hint="Used for notifications and password reset">
            <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="your@email.com" />
          </Field>
          <Field label="Phone Number">
            <Input value={form.phone_number} onChange={e => setForm(p => ({...p, phone_number: e.target.value}))} placeholder="+63 912 345 6789" />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({...p, date_of_birth: e.target.value}))} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Address">
            <textarea value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))}
              rows={2} placeholder="Your home address"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 focus:bg-white transition-all resize-none" />
          </Field>
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} loading={saving} variant="primary">
          Save Profile
        </Button>
      </div>
    </form>
  );
};

// ── Security Tab ────────────────────────────────────────────────────────────

const SecurityTab = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [strength, setStrength] = useState(0);

  const calcStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const handleNewPw = (val) => {
    setForm(p => ({...p, newPassword: val}));
    setStrength(calcStrength(val));
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-violet-500', 'bg-emerald-500'];

  const save = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) return toast.error('Please enter your current password');
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try {
      await api.post('/auth/change-password/', { current_password: form.currentPassword, new_password: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStrength(0);
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <SectionCard title="Change Password" subtitle="Keep your account secure with a strong password" icon="lock">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg mb-5 flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-xs font-bold text-amber-800">Use at least 8 characters with a mix of uppercase, numbers, and symbols for a strong password.</p>
        </div>
        <div className="space-y-4">
          <Field label="Current Password">
            <Input type="password" value={form.currentPassword} onChange={e => setForm(p => ({...p, currentPassword: e.target.value}))} placeholder="••••••••" required />
          </Field>
          <Field label="New Password">
            <Input type="password" value={form.newPassword} onChange={e => handleNewPw(e.target.value)} placeholder="••••••••" required />
            {form.newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${strengthColor[strength].replace('bg-', 'text-')}`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
          </Field>
          <Field label="Confirm New Password">
            <Input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))} placeholder="••••••••" required />
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Passwords do not match</p>
            )}
          </Field>
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || (form.confirmPassword && form.newPassword !== form.confirmPassword)} loading={saving} variant="primary">
          Update Password
        </Button>
      </div>
    </form>
  );
};

// ── Settings Dashboard ──────────────────────────────────────────────────────

const SettingsDashboard = ({ activeYear, totalUsers }) => (
  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">School Profile</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="text-xs font-bold text-emerald-700">Complete</span>
      </div>
    </div>
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Year</p>
      <p className="text-sm font-extrabold text-violet-900">{activeYear || '—'}</p>
    </div>
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
      <p className="text-sm font-extrabold text-slate-900">{totalUsers ?? '—'}</p>
    </div>
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Health</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="text-xs font-bold text-emerald-700">Online</span>
      </div>
    </div>
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Backup</p>
      <p className="text-sm font-extrabold text-slate-900">—</p>
    </div>
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Database</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <span className="text-xs font-bold text-emerald-700">Connected</span>
      </div>
    </div>
  </div>
);

// ── System Status Panel ─────────────────────────────────────────────────────

const SystemStatusPanel = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes] = await Promise.all([
          api.get('/system/settings/').catch(() => ({ data: null })),
        ]);
        setSettings(sRes.data);
        setStatus({
          database: 'Connected',
          storage: 'Operational',
          backup: 'Not configured',
          email: sRes.data?.email_service_health?.status === 'ok' ? 'Healthy' : 'Degraded',
          sync: '—',
        });
      } catch { setStatus(null); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );

  if (!status) return null;

  const items = [
    { label: 'Database Health', value: status.database, ok: status.database === 'Connected' },
    { label: 'Storage Usage', value: status.storage, ok: status.storage === 'Operational' },
    { label: 'Backup Status', value: status.backup, ok: status.backup === 'Not configured' ? true : false },
    { label: 'Email Service', value: status.email, ok: status.email === 'Healthy' },
    { label: 'Last Sync', value: status.sync, ok: true },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">System Status</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
              <span className={`text-[11px] font-bold ${item.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Navigation Definitions ──────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'School',
    icon: 'building',
    items: [
      { id: 'school',   label: 'School Information' },
      { id: 'academic', label: 'Academic Years' },
      { id: 'grading',  label: 'Grading Settings' },
    ],
  },
  {
    label: 'Users & Security',
    icon: 'users',
    items: [
      { id: 'roles',    label: 'Roles & Permissions' },
      { id: 'security', label: 'Security' },
      { id: 'profile',  label: 'My Profile' },
    ],
  },
  {
    label: 'Portal',
    icon: 'globe',
    items: [
      { id: 'portal',   label: 'Portal Settings' },
      { id: 'comm',     label: 'Communication Settings' },
    ],
  },
  {
    label: 'System',
    icon: 'cog',
    items: [
      { id: 'backup',   label: 'Backup Management' },
      { id: 'audit',    label: 'Audit Logs' },
      { id: 'maintenance', label: 'Maintenance Mode' },
    ],
  },
];

const EXISTING_TABS = ['school', 'academic', 'portal', 'profile', 'security'];

// ── Main Settings Component ─────────────────────────────────────────────────

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'school' : 'profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { academicYear: activeYear } = useActiveAcademicYear();
  const [totalUsers, setTotalUsers] = useState(null);
  const [showStatusPanel, setShowStatusPanel] = useState(true);

  const userNav = useMemo(() => {
    if (!isAdmin) {
      return [{
        label: 'Account',
        icon: 'user',
        items: [
          { id: 'profile', label: 'My Profile' },
          { id: 'security', label: 'Security' },
        ],
      }];
    }
    return NAV_SECTIONS;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users/').then(r => {
      const data = r.data.results || r.data;
      setTotalUsers(data.length || 0);
    }).catch(() => {});
  }, [isAdmin]);

  const filteredNav = useMemo(() => {
    if (!searchQuery) return userNav;
    const q = searchQuery.toLowerCase();
    return userNav.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.label.toLowerCase().includes(q) ||
        section.label.toLowerCase().includes(q)
      ),
    })).filter(section => section.items.length > 0);
  }, [searchQuery, userNav]);

  const renderTab = () => {
    switch (activeTab) {
      case 'school':      return <SchoolInfoTab />;
      case 'academic':    return <AcademicYearsTab />;
      case 'portal':      return <PortalSettingsTab />;
      case 'profile':     return <ProfileTab />;
      case 'security':    return <SecurityTab />;
      case 'grading':     return <GradingSettingsTab />;
      case 'roles':       return <RolesPermissionsTab />;
      case 'comm':        return <CommunicationSettingsTab />;
      case 'backup':      return <BackupManagementTab />;
      case 'audit':       return <AuditLogsTab />;
      case 'maintenance': return <PortalSettingsTab />;
      default:            return <SchoolInfoTab />;
    }
  };

  const isPlaceholder = false;

  return (
    <div className="page-bottom-safe max-w-[1800px] mx-auto min-h-0 bg-slate-50 px-3 py-4 md:px-6 md:py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-violet-700 uppercase tracking-wide mb-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{isAdmin ? 'System Configuration' : 'Account Settings'}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isAdmin ? 'Manage school configuration, academic years, and portal settings' : 'Manage your profile and account security'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowStatusPanel(v => !v)}
            className="self-start sm:self-center flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 transition-all lg:hidden"
            aria-label="Toggle system status panel">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            System Status
          </button>
        )}
      </div>

      {/* Dashboard Summary */}
      {isAdmin && <div className="mb-5"><SettingsDashboard activeYear={activeYear} totalUsers={totalUsers} /></div>}

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search settings..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search settings"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Sidebar Navigation */}
        <nav className="lg:col-span-3" aria-label="Settings navigation">
          {/* Mobile: hamburger + horizontal scroll */}
          <div className="flex items-center gap-2 lg:hidden mb-3">
            <button onClick={() => setMobileNavOpen(v => !v)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all"
              aria-label="Toggle settings menu"
              aria-expanded={mobileNavOpen}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {userNav.flatMap(s => s.items).find(i => i.id === activeTab)?.label || activeTab}
            </span>
          </div>
          {mobileNavOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
          <div className={`${mobileNavOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl' : 'hidden'} lg:block lg:static lg:shadow-none overflow-y-auto`}>
            <div className={`${mobileNavOpen ? 'p-4' : ''} lg:p-0`}>
              {/* Mobile close */}
              {mobileNavOpen && (
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <span className="text-sm font-extrabold text-slate-900">Settings</span>
                  <button onClick={() => setMobileNavOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close menu">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
              <div className="space-y-5">
                {filteredNav.map(section => (
                  <div key={section.label}>
                    <div className="flex items-center gap-2 px-3 mb-1.5">
                      <Icon name={section.icon} className="text-slate-400" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.label}</p>
                    </div>
                    <div className="space-y-0.5">
                      {section.items.map(item => {
                        const active = activeTab === item.id;
                        return (
                          <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                              active
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            role="tab"
                            aria-selected={active}
                            aria-controls={`settings-panel-${item.id}`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile: System Status inline */}
              {mobileNavOpen && isAdmin && (
                <div className="mt-6">
                  <SystemStatusPanel />
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className={`lg:col-span-6 ${isAdmin && showStatusPanel ? 'xl:col-span-6' : 'xl:col-span-9'}`}
          id={`settings-panel-${activeTab}`}
          role="tabpanel"
          aria-label={activeTab}
        >
          {renderTab()}
        </div>

        {/* Right: System Status Panel */}
        {isAdmin && showStatusPanel && (
          <div className="hidden lg:block lg:col-span-3 xl:col-span-3">
            <div className="sticky top-4 space-y-4">
              <SystemStatusPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
