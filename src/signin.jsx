import { useState } from 'react';
import { GoogleIcon } from './icons.jsx';
import { useApp } from './lib/context.js';

const TABS = [
  ['google', 'Google'],
  ['email', 'Email'],
  ['leetcode', 'LeetCode']
];

export function SignInPanel({ onDone }) {
  const { auth, online, notify } = useApp();
  const [tab, setTab] = useState(auth.enabled ? 'google' : 'leetcode');

  return (
    <div className="signin">
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'google' && <GoogleTab auth={auth} />}
      {tab === 'email' && <EmailTab auth={auth} notify={notify} onDone={onDone} />}
      {tab === 'leetcode' && <LeetcodeTab auth={auth} online={online} notify={notify} onDone={onDone} />}
    </div>
  );
}

function Message({ msg }) {
  return msg ? (
    <p className={'msg' + (msg.error ? ' error' : '')} role="status">
      {msg.text}
    </p>
  ) : null;
}

const NEEDS_SUPABASE = 'Google and email sign-in need Supabase keys in your .env file (see the README). LeetCode sign-in works without them.';

function GoogleTab({ auth }) {
  const [msg, setMsg] = useState(null);
  const go = async () => {
    const error = await auth.signInGoogle();
    if (error) setMsg({ text: error, error: true });
  };
  return (
    <div className="tab-body">
      <p className="note">Sign in with your Google account. We only receive your name, email, and photo.</p>
      <button className="gbtn" disabled={!auth.enabled} onClick={go}>
        <GoogleIcon /> Continue with Google
      </button>
      {!auth.enabled && <p className="msg">{NEEDS_SUPABASE}</p>}
      <Message msg={msg} />
    </div>
  );
}

function EmailTab({ auth, notify, onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const run = async mode => {
    const clean = email.trim();
    if (!clean || (mode !== 'link' && password.length < 6)) {
      setMsg({ text: mode === 'link' ? 'Enter your email address.' : 'Enter your email and a password of at least 6 characters.', error: true });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const error = await auth.signIn(clean, password);
        if (error) setMsg({ text: error, error: true });
        else {
          notify('Signed in. Your progress will sync.');
          onDone?.();
        }
      } else if (mode === 'signup') {
        const result = await auth.signUp(clean, password);
        if (result.error) setMsg({ text: result.error, error: true });
        else if (result.confirm) setMsg({ text: 'Check your email to confirm your account, then sign in.' });
        else {
          notify('Account created. Your progress will sync.');
          onDone?.();
        }
      } else {
        const error = await auth.magicLink(clean);
        setMsg(error ? { text: error, error: true } : { text: 'Sign-in link sent. Check your email.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="tab-body"
      onSubmit={e => {
        e.preventDefault();
        run('signin');
      }}
    >
      <input type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={!auth.enabled} />
      <input type="password" autoComplete="current-password" placeholder="Password (6+ characters)" aria-label="Password" value={password} onChange={e => setPassword(e.target.value)} disabled={!auth.enabled} />
      <div className="modal-actions">
        <button type="submit" className="primary" disabled={busy || !auth.enabled}>
          Sign in
        </button>
        <button type="button" className="outline" disabled={busy || !auth.enabled} onClick={() => run('signup')}>
          Create account
        </button>
      </div>
      <button type="button" className="linklike" disabled={busy || !auth.enabled} onClick={() => run('link')}>
        Email me a sign-in link instead
      </button>
      {!auth.enabled && <p className="msg">{NEEDS_SUPABASE}</p>}
      <Message msg={msg} />
    </form>
  );
}

function LeetcodeTab({ auth, online, notify, onDone }) {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('name');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const guard = async fn => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (error) {
      setMsg({ text: error.message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const getCode = () =>
    guard(async () => {
      const result = await auth.leetcodeStart(username.trim());
      setUsername(result.username);
      setCode(result.code);
      setStep('code');
    });

  const verify = () =>
    guard(async () => {
      await auth.leetcodeVerify(username);
      notify(`Signed in as ${username} via LeetCode.`);
      onDone?.();
    });

  return (
    <div className="tab-body">
      {step === 'name' && (
        <>
          <p className="note">LeetCode has no "log in with" button, so we confirm you own the profile instead: you paste a one-time code into your public profile summary and we check for it.</p>
          <input placeholder="Your LeetCode username" aria-label="LeetCode username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && username.trim() && getCode()} disabled={!online} />
          <div className="modal-actions">
            <button className="primary" disabled={busy || !online || !username.trim()} onClick={getCode}>
              {busy ? 'Looking you up…' : 'Get my code'}
            </button>
          </div>
          {!online && <p className="msg">Start the API server (npm run server) to use LeetCode sign-in.</p>}
        </>
      )}
      {step === 'code' && (
        <>
          <p className="note">
            Hi <b>{username}</b>. Add this code to your LeetCode profile:
          </p>
          <div className="code-box">
            <code>{code}</code>
            <button className="outline" onClick={() => navigator.clipboard?.writeText(code).then(() => notify('Code copied.'), () => {})}>
              Copy
            </button>
          </div>
          <ol className="steps">
            <li>
              Open <b>leetcode.com</b>, then your profile, then <b>Edit Profile</b>.
            </li>
            <li>
              Paste the code anywhere in <b>Summary</b> and save.
            </li>
            <li>Come back here and verify. The code works for about an hour, and you can delete it afterwards.</li>
          </ol>
          <div className="modal-actions">
            <button className="primary" disabled={busy} onClick={verify}>
              {busy ? 'Checking…' : 'Verify and sign in'}
            </button>
            <button
              className="outline"
              disabled={busy}
              onClick={() => {
                setStep('name');
                setMsg(null);
              }}
            >
              Change username
            </button>
          </div>
        </>
      )}
      <Message msg={msg} />
    </div>
  );
}
