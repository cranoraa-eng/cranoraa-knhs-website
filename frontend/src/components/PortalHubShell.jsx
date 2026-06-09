import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PortalHubShell = ({ title, description, tabs }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const visibleTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (tab.roles && !tab.roles.includes(user?.role)) return false;
      if (typeof tab.show === 'function' && !tab.show(user)) return false;
      return true;
    });
  }, [tabs, user]);

  const activeTabId = searchParams.get('tab');
  const activeTab = visibleTabs.find((tab) => tab.id === activeTabId) || visibleTabs[0];

  useEffect(() => {
    if (!visibleTabs.length) return;
    if (!activeTab || activeTab.id !== activeTabId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', visibleTabs[0].id);
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, activeTabId, searchParams, setSearchParams, visibleTabs]);

  if (!visibleTabs.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">No tools are available in this workspace for your account.</p>
      </div>
    );
  }

  const ActiveComponent = activeTab.component;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-700">Portal Workspace</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">{title}</h2>
              {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p> : null}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {visibleTabs.length} tool{visibleTabs.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 md:px-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleTabs.map((tab) => {
              const isActive = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set('tab', tab.id);
                    setSearchParams(nextParams);
                  }}
                  className={`shrink-0 rounded-md border px-3 py-2 text-xs font-extrabold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'border-violet-700 bg-violet-700 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section key={activeTab.id} className="min-w-0">
        <ActiveComponent />
      </section>
    </div>
  );
};

export default PortalHubShell;
