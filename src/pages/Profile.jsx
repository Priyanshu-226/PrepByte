import { useRef, useState } from 'react';
import { DownloadIcon, UploadIcon } from '../icons.jsx';
import { Select } from '../ui.jsx';
import { SignInPanel } from '../signin.jsx';
import { api } from '../lib/api.js';
import { useApp } from '../lib/context.js';
import { daysLeft } from '../lib/stats.js';

const ROLES = ['SDE Intern', 'SDE I', 'SDE II', 'Senior SDE'];
const SYNC_TEXT = { local: 'Saved on this device only.', syncing: 'Syncing…', synced: 'Synced to your account.', error: 'Could not reach the server. Your progress is still saved on this device.' };
const PROVIDER = { google: 'Google', email: 'Email', leetcode: 'LeetCode' };

export default function Profile() {
  const { progress, displayName, initials, companies, auth, sync, retrySync, setName, setGoal, replaceAll, reset, notify, goPractice } = useApp();
  const fileRef = useRef(null);
  const { goal } = progress;
  const left = daysLeft(goal.targetDate);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prepbyte-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        replaceAll(JSON.parse(String(reader.result)));
        notify('Progress imported.');
      } catch {
        notify("That file isn't a PrepByte export.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <section className="panel profile-page">
        {auth.user?.avatar ? <img className="avatar-lg" src={auth.user.avatar} alt="" referrerPolicy="no-referrer" /> : <b>{initials}</b>}
        <div>
          <small>YOUR PREP PROFILE</small>
          <h2>{displayName || 'Your profile'}</h2>
          <p>
            {progress.solved.length} solved · {progress.saved.length} bookmarked
          </p>
        </div>
        <button onClick={() => goPractice({})}>Open practice</button>
      </section>

      <section className="settings">
        <div className="panel wide" id="account">
          {auth.user ? (
            <>
              <h3>Account and sync</h3>
              <div className="account">
                {auth.user.avatar ? <img className="avatar-lg sm" src={auth.user.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{initials}</span>}
                <div>
                  <b>{auth.user.name || auth.user.email}</b>
                  <small>
                    {PROVIDER[auth.user.provider]} account{auth.user.email ? ` · ${auth.user.email}` : ''}
                  </small>
                </div>
              </div>
              <p className="note">{SYNC_TEXT[sync]}</p>
              <div className="modal-actions">
                {sync === 'error' && (
                  <button className="outline" onClick={retrySync}>
                    Try again
                  </button>
                )}
                <button className="outline" onClick={() => auth.signOut()}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>Sign in</h3>
              <p className="note">Sign in to keep your progress across devices. Choose Google, email, or verify your LeetCode profile.</p>
              <SignInPanel />
            </>
          )}
        </div>

        <div className="panel">
          <h3>About you</h3>
          <label className="field">
            <span>Display name</span>
            <input value={progress.name} maxLength={60} placeholder="What should we call you?" onChange={e => setName(e.target.value)} />
          </label>
        </div>

        <div className="panel">
          <h3>Interview target</h3>
          <label className="field">
            <span>Company</span>
            <Select label="Target company" v={goal.company} set={company => setGoal({ company })} options={companies.map(c => c.name)} />
          </label>
          <label className="field">
            <span>Role</span>
            <Select label="Target role" v={ROLES.includes(goal.role) ? goal.role : ROLES[1]} set={role => setGoal({ role })} options={ROLES} />
          </label>
          <label className="field">
            <span>Interview date</span>
            <input type="date" value={goal.targetDate} onChange={e => e.target.value && setGoal({ targetDate: e.target.value })} />
          </label>
          <p className="note">{left > 0 ? `${left} ${left === 1 ? 'day' : 'days'} left to prepare.` : 'That date has passed. Pick a new one.'}</p>
        </div>

        <LeetcodePanel />

        <div className="panel">
          <h3>Your data</h3>
          <p className="note">Export a backup, move progress to another browser, or start over.</p>
          <div className="modal-actions">
            <button className="outline" onClick={exportData}>
              <DownloadIcon size={14} /> Export
            </button>
            <button className="outline" onClick={() => fileRef.current?.click()}>
              <UploadIcon size={14} /> Import
            </button>
            <button
              className="outline danger"
              onClick={() => {
                if (window.confirm('Reset all progress, notes, and reviews? This cannot be undone.')) {
                  reset();
                  notify('Progress reset.');
                }
              }}
            >
              Reset progress
            </button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
          </div>
        </div>
      </section>
    </>
  );
}

function LeetcodePanel() {
  const { progress, auth, online, byId, setLeetcode, importSolved, notify } = useApp();
  const [username, setUsername] = useState(progress.leetcode || auth.user?.username || '');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  const sync = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api.leetcode(username.trim());
      setInfo(data);
      setLeetcode(data.username);
      const matches = data.recent.filter(r => byId.has(r.slug)).map(r => ({ id: r.slug, at: r.at }));
      const added = importSolved(matches);
      notify(added ? `Imported ${added} new ${added === 1 ? 'solve' : 'solves'} from LeetCode.` : 'LeetCode is synced. Nothing new to import.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel wide">
      <h3>LeetCode</h3>
      <p className="note">Link your username to see your LeetCode stats and import your recent accepted submissions that match questions in this library. Only public profile data is read.</p>
      <div className="inline-form">
        <input placeholder="LeetCode username" aria-label="LeetCode username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && username.trim() && sync()} disabled={!online} />
        <button className="primary" disabled={busy || !online || !username.trim()} onClick={sync}>
          {busy ? 'Syncing…' : info || progress.leetcode ? 'Sync again' : 'Link and sync'}
        </button>
      </div>
      {!online && <p className="msg">Start the API server (npm run server) to link LeetCode.</p>}
      {error && <p className="msg error">{error}</p>}
      {info && (
        <div className="lc-stats">
          <div>
            <b>{info.solved.all}</b>
            <span>solved on LeetCode</span>
          </div>
          <div>
            <b className="easy">{info.solved.easy}</b>
            <span>easy</span>
          </div>
          <div>
            <b className="medium">{info.solved.medium}</b>
            <span>medium</span>
          </div>
          <div>
            <b className="hard">{info.solved.hard}</b>
            <span>hard</span>
          </div>
          {info.ranking && (
            <div>
              <b>{info.ranking.toLocaleString()}</b>
              <span>global rank</span>
            </div>
          )}
        </div>
      )}
      {info && info.recent.length > 0 && (
        <p className="note">
          Recent accepted: {info.recent.slice(0, 5).map(r => r.title).join(', ')}. LeetCode only shares your latest submissions publicly, so older solves can be ticked off manually.
        </p>
      )}
    </div>
  );
}
