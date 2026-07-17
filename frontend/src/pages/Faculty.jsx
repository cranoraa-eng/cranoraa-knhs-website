import { useState } from 'react';
import { administration, faculty, getInitials } from '../data/facultyData';

// ── Position badge color mapping ─────────────────────────────────────────────
const BADGE_COLORS = {
  'School Principal I':          'bg-yellow-100 text-yellow-800 border-yellow-200',
  'School Guidance Designate':   'bg-blue-100 text-blue-800 border-blue-200',
  'Administrative Officer I':    'bg-slate-100 text-slate-700 border-slate-200',
  'Administrative Assistant III':'bg-slate-100 text-slate-700 border-slate-200',
  'Master Teacher I':            'bg-violet-100 text-violet-800 border-violet-200',
  'Special Science Teacher I':   'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Teacher VI':                  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Teacher V':                   'bg-purple-100 text-purple-800 border-purple-200',
  'Teacher IV':                  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'Teacher III':                 'bg-sky-100 text-sky-800 border-sky-200',
  'Teacher II':                  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Teacher I':                   'bg-teal-100 text-teal-800 border-teal-200',
  'ALS Teacher':                 'bg-orange-100 text-orange-800 border-orange-200',
};

function badgeColor(position) {
  return BADGE_COLORS[position] ?? 'bg-slate-100 text-slate-700 border-slate-200';
}

// ── Avatar — shows photo if available, otherwise coloured initials ───────────
function Avatar({ name, photo, size = 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = photo && !imgError;

  // Portrait (3:4) container — matches typical ID/headshot photos
  const sizeClasses = {
    lg: 'w-32 h-44 text-2xl',   // ~128×176 px
    md: 'w-24 h-32 text-lg',    // ~96×128 px
  };

  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl overflow-hidden flex items-center justify-center
        bg-violet-100 border-2 border-slate-200 shadow-sm mx-auto flex-shrink-0`}
      aria-label={`Photo of ${name}`}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`font-black text-violet-700 select-none ${sizeClasses[size].split(' ').at(-1)}`}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ── Individual person card ────────────────────────────────────────────────────
function PersonCard({ person }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden
      hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
      {/* Portrait photo area */}
      <div className="bg-slate-50 flex items-center justify-center pt-5 pb-3 px-4">
        <Avatar name={person.name} photo={person.photo} size="lg" />
      </div>
      {/* Info */}
      <div className="px-4 pb-5 pt-2 text-center">
        <h3 className="text-xs font-black text-slate-900 leading-snug uppercase tracking-wide">
          {person.name}
        </h3>
        <span className={`mt-2 inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeColor(person.position)}`}>
          {person.position}
        </span>
      </div>
    </div>
  );
}

// ── Admin card — slightly larger, featured layout ────────────────────────────
function AdminCard({ person }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-violet-200 overflow-hidden
      hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Portrait photo area */}
      <div className="bg-violet-50 flex items-center justify-center pt-6 pb-3 px-4">
        <Avatar name={person.name} photo={person.photo} size="lg" />
      </div>
      {/* Info */}
      <div className="px-4 pb-6 pt-2 text-center">
        <h3 className="text-sm font-black text-slate-900 leading-snug uppercase tracking-wide">
          {person.name}
        </h3>
        <span className={`mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${badgeColor(person.position)}`}>
          {person.position}
        </span>
      </div>
    </div>
  );
}

// ── Group faculty by position rank ───────────────────────────────────────────
const RANK_ORDER = [
  'Master Teacher I',
  'Special Science Teacher I',
  'Teacher VI',
  'Teacher V',
  'Teacher IV',
  'Teacher III',
  'Teacher II',
  'Teacher I',
  'ALS Teacher',
  'ALIVE Teacher',
];

function groupByPosition(list) {
  const groups = {};
  for (const person of list) {
    if (!groups[person.position]) groups[person.position] = [];
    groups[person.position].push(person);
  }
  // Return in rank order, then any leftovers
  const ordered = [];
  for (const rank of RANK_ORDER) {
    if (groups[rank]) ordered.push({ position: rank, members: groups[rank] });
  }
  for (const [pos, members] of Object.entries(groups)) {
    if (!RANK_ORDER.includes(pos)) ordered.push({ position: pos, members });
  }
  return ordered;
}

// ── Page stats ────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'School Administration', value: administration.length },
  { label: 'Teaching Staff', value: faculty.filter(f => f.position.startsWith('Teacher') || f.position.includes('Science') || f.position.includes('Master')).length },
  { label: 'ALS / ALIVE', value: faculty.filter(f => f.position.includes('ALS') || f.position.includes('ALIVE')).length },
  { label: 'Total Personnel', value: administration.length + faculty.length },
];

// ── Main page ─────────────────────────────────────────────────────────────────
const Faculty = () => {
  const [search, setSearch] = useState('');
  const groups = groupByPosition(faculty);

  const filteredAdmin = administration.filter(
    (p) =>
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.position.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      members: search
        ? g.members.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.position.toLowerCase().includes(search.toLowerCase()),
          )
        : g.members,
    }))
    .filter((g) => g.members.length > 0);

  const totalResults = filteredAdmin.length + filteredGroups.reduce((s, g) => s + g.members.length, 0);

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="bg-violet-950 py-16 md:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-3">
            Kiwalan National High School
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase mb-4">
            Faculty & Staff
          </h1>
          <p className="text-violet-200 text-lg max-w-xl leading-relaxed">
            Meet the dedicated educators and professionals who make KNHS a center of excellence — School Year 2025–2026.
          </p>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm">
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-xs font-bold text-violet-200 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search bar ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search by name or position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
                placeholder:text-slate-400 bg-slate-50"
              aria-label="Search faculty and staff"
            />
          </div>
          {search && (
            <p className="text-xs text-slate-500 font-semibold">
              {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* ── School Administration ── */}
      {filteredAdmin.length > 0 && (
        <section className="py-16 md:py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-widest mb-2">Leadership</p>
              <h2 className="text-3xl font-black text-slate-900 uppercase">School Administration</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {filteredAdmin.map((person) => (
                <AdminCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Teaching Staff (grouped by rank) ── */}
      {filteredGroups.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-widest mb-2">Our Educators</p>
              <h2 className="text-3xl font-black text-slate-900 uppercase">Teaching Staff</h2>
            </div>

            <div className="space-y-14">
              {filteredGroups.map(({ position, members }) => (
                <div key={position}>
                  {/* Group header */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${badgeColor(position)}`}>
                      {position}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {members.map((person) => (
                      <PersonCard key={person.id} person={person} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── No results ── */}
      {totalResults === 0 && search && (
        <div className="py-24 text-center">
          <p className="text-slate-400 text-lg font-semibold">No results for &ldquo;{search}&rdquo;</p>
          <button
            onClick={() => setSearch('')}
            className="mt-4 text-sm font-bold text-violet-700 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* ── Join us CTA ── */}
      <section className="py-16 bg-violet-950 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black uppercase mb-3">Join Our Team</h2>
          <p className="text-violet-200 mb-6 text-sm leading-relaxed">
            Interested in becoming part of the Kiwalan NHS family? We are always looking for passionate
            educators committed to shaping the next generation.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-violet-950 font-black uppercase tracking-wider
              text-xs px-6 py-3 rounded-xl hover:bg-violet-100 transition-colors"
          >
            Get in Touch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

    </div>
  );
};

export default Faculty;
