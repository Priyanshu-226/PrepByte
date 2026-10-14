import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, BriefcaseBusiness, Code2, LayoutDashboard, Search, Target } from 'lucide-react';
import { FlameIcon, RefreshIcon, TimerIcon } from './icons.jsx';
import { AppCtx } from './lib/context.js';
import { useAuth } from './lib/useAuth.js';
import { useCatalog } from './lib/useCatalog.js';
import { useProgress } from './lib/useProgress.js';
import { currentStreak, readiness, reviewQueue } from './lib/stats.js';
import { AuthModal, Palette, ProblemModal } from './modals.jsx';
import Companies from './pages/Companies.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Insights from './pages/Insights.jsx';
import Mock from './pages/Mock.jsx';
import Practice from './pages/Practice.jsx';
import Profile from './pages/Profile.jsx';
import Revision from './pages/Revision.jsx';
import Roadmaps from './pages/Roadmaps.jsx';

const NAV = [
  ['Dashboard', LayoutDashboard],
  ['Practice', Code2],
  ['Roadmaps', Target],
  ['Companies', BriefcaseBusiness],
  ['Revision', RefreshIcon],
  ['Mock', TimerIcon],
  ['Insights', BarChart3]
];
const PAGE_NAMES = [...NAV.map(([name]) => name), 'Profile'];
const PAGES = { Dashboard, Practice, Roadmaps, Companies, Revision, Mock, Insights, Profile };
const DEFAULT_FILTERS = { q: '', company: 'All', topic: 'All', level: 'All', status: 'All', acceptance: 'Any rate', sort: 'Most asked' };
const SYNC_LABEL = { local: 'LOCAL', syncing: 'SYNCING…', synced: 'SYNCED', error: 'SYNC FAILED' };

const pageFromHash = () => {
  const hash = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  return PAGE_NAMES.find(n => n.toLowerCase() === hash.toLowerCase()) || 'Dashboard';
};
const initialsOf = name =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'P';

export default function App() {
  const auth = useAuth();
  const { catalog, online } = useCatalog();
  const { progress, actions, sync, retrySync } = useProgress({ userId: auth.user?.id, token: auth.token });
  const { problems, byId, companies, topics } = catalog;

  const [page, setPageState] = useState(pageFromHash);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const onHash = () => setPageState(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setPage = useCallback(name => {
    window.location.hash = `/${name.toLowerCase()}`;
    window.scrollTo(0, 0);
  }, []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const goPractice = useCallback(
    (patch = {}) => {
      setFilters({ ...DEFAULT_FILTERS, ...patch });
      setPage('Practice');
    },
    [setPage]
  );
  const notify = useCallback(msg => {
    const id = Date.now();
    setToast({ id, msg });
    setTimeout(() => setToast(t => (t && t.id === id ? null : t)), 2800);
  }, []);
  const openProblem = useCallback(p => setSelectedId(p.id), []);
  const openAuth = useCallback(() => setAuthOpen(true), []);

  const solvedSet = useMemo(() => new Set(progress.solved), [progress.solved]);
  const savedSet = useMemo(() => new Set(progress.saved), [progress.saved]);
  const score = useMemo(() => readiness(problems, topics, solvedSet, progress.goal.company), [problems, topics, solvedSet, progress.goal.company]);
  const streak = currentStreak(progress.activity);
  const due = useMemo(() => reviewQueue(progress.reviews, byId).due, [progress.reviews, byId]);

  const toggleSolved = useCallback(
    (id, seconds) => {
      const nowSolved = actions.toggleSolved(id, seconds);
      notify(nowSolved ? 'Marked as solved. First review is due tomorrow.' : 'Marked as not solved.');
    },
    [actions, notify]
  );
  const toggleSaved = useCallback(
    id => {
      notify(actions.toggleSaved(id) ? 'Saved for review.' : 'Removed from saved.');
    },
    [actions, notify]
  );
  const review = useCallback(
    (id, ok) => {
      const days = actions.review(id, ok);
      notify(ok ? `Nice. Next review in ${days} ${days === 1 ? 'day' : 'days'}.` : "No problem. You'll see it again tomorrow.");
    },
    [actions, notify]
  );

  const markSolved = useCallback(id => { if (!solvedSet.has(id)) actions.toggleSolved(id); }, [actions, solvedSet]);

  const displayName = progress.name || auth.user?.name || '';
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const title = page === 'Dashboard' ? (displayName ? `${hello}, ${displayName.split(' ')[0]}.` : `${hello}.`) : page;
  const statusLabel = auth.user ? SYNC_LABEL[sync] : online ? 'API LIVE' : 'OFFLINE DEMO';

  const ctx = {
    problems, byId, companies, topics,
    progress, solvedSet, savedSet, score, streak, due,
    isSolved: id => solvedSet.has(id),
    isSaved: id => savedSet.has(id),
    toggleSolved, toggleSaved, review,
    online, markSolved, addMock: actions.addMock, importSolved: actions.importSolved, setLeetcode: actions.setLeetcode,
    setNote: actions.setNote, setName: actions.setName, setGoal: actions.setGoal, replaceAll: actions.replaceAll, reset: actions.reset,
    filters, setFilters, resetFilters, goPractice,
    setPage, pages: PAGE_NAMES, openProblem, openAuth, notify,
    auth, sync, retrySync, displayName, initials: initialsOf(displayName)
  };

  const Page = PAGES[page];
  const selected = selectedId ? byId.get(selectedId) : null;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app">
        <aside>
          <button className="brand" onClick={() => setPage('Dashboard')}>
            <b>p</b>prepbyte
          </button>
          <small>WORKSPACE</small>
          {NAV.map(([name, Icon]) => (
            <button className={page === name ? 'nav on' : 'nav'} onClick={() => setPage(name)} key={name} aria-current={page === name ? 'page' : undefined}>
              <Icon size={18} />
              {name}
              {name === 'Revision' && due.length > 0 && <span className="badge">{due.length}</span>}
            </button>
          ))}
          <div className="streak">
            <FlameIcon size={18} />
            <span>
              <b>{streak ? `${streak} day streak` : 'No streak yet'}</b>
              <small>{streak ? 'Keep it going today.' : 'Solve one problem today.'}</small>
            </span>
          </div>
          <button className="me" onClick={() => setPage('Profile')}>
            <span className="avatar">{ctx.initials}</span>
            <span>
              <b>{displayName || 'Guest'}</b>
              <small>{auth.user ? auth.user.email || `${auth.user.provider} account` : 'Set up your profile'}</small>
            </span>
          </button>
        </aside>

        <main className="main">
          <header>
            <div>
              <small>INTERVIEW PREPARATION PLATFORM</small>
              <h1>{title}</h1>
            </div>
            <div className="head-actions">
              <span className={'live-status' + (online ? ' on' : '')}>{statusLabel}</span>
              <button className="outline search-btn" onClick={() => setPaletteOpen(true)} aria-label="Search (Ctrl or Command K)">
                <Search size={14} /> <span>Search</span> <kbd>Ctrl K</kbd>
              </button>
              {!auth.user && (
                <button className="outline" onClick={openAuth}>
                  Sign in
                </button>
              )}
              <button className="profile" onClick={() => setPage('Profile')}>
                Profile
              </button>
            </div>
          </header>
          <Page />
        </main>

        <nav className="tabbar" aria-label="Main">
          {NAV.map(([name, Icon]) => (
            <button className={page === name ? 'on' : ''} onClick={() => setPage(name)} key={name} aria-label={name}>
              <Icon size={20} />
              {name === 'Revision' && due.length > 0 && <span className="dot" />}
            </button>
          ))}
        </nav>

        {selected && <ProblemModal key={selected.id} p={selected} close={() => setSelectedId(null)} />}
        {authOpen && <AuthModal close={() => setAuthOpen(false)} />}
        {paletteOpen && <Palette close={() => setPaletteOpen(false)} />}
        {toast && (
          <div className="toast" role="status">
            {toast.msg}
          </div>
        )}
      </div>
    </AppCtx.Provider>
  );
}
