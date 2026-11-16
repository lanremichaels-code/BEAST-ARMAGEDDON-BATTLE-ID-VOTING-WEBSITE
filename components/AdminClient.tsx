"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  battle_id: string;
  image_url: string;
  created_at: string;
};

type Poll = {
  id: string;
  title: string;
  is_active: boolean;
  total_votes: number;
};

export default function AdminClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const [title, setTitle] = useState("Community Battle Vote");
  const [description, setDescription] = useState(
    "Vote for the next gameplay to be featured on the channel."
  );

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Manual submission states
  const [manualBattleId, setManualBattleId] = useState("");
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMessage, setManualMessage] = useState("");

  async function loadDashboard() {
    const res = await fetch("/api/admin/dashboard", {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();

      setAuthenticated(true);
      setSubmissions(data.submissions ?? []);
      setPolls(data.polls ?? []);
    } else {
      setAuthenticated(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Login failed.");
      } else {
        setPassword("");
        await loadDashboard();
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }

    setBusy(false);
  }

  function toggle(id: string) {
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  }

  // ADD BATTLE MANUALLY
  async function addManualSubmission(e: React.FormEvent) {
    e.preventDefault();

    if (!manualBattleId.trim() || !manualImage) {
      setManualMessage("Battle ID and screenshot are required.");
      return;
    }

    if (manualImage.size > 5 * 1024 * 1024) {
      setManualMessage("Image must be 5MB or smaller.");
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(manualImage.type)
    ) {
      setManualMessage("Only JPG, PNG and WebP images are accepted.");
      return;
    }

    setManualBusy(true);
    setManualMessage("");

    try {
      const formData = new FormData();

      formData.append("battle_id", manualBattleId.trim());
      formData.append("image", manualImage);

      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setManualMessage(data.error || "Could not add battle.");
      } else {
        setManualMessage("Battle added successfully!");

        setManualBattleId("");
        setManualImage(null);

        const fileInput = document.getElementById(
          "manual-battle-image"
        ) as HTMLInputElement | null;

        if (fileInput) {
          fileInput.value = "";
        }

        await loadDashboard();
      }
    } catch {
      setManualMessage("Something went wrong. Please try again.");
    }

    setManualBusy(false);
  }

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          submission_ids: selected,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not create poll.");
      } else {
        setMessage("Poll published successfully.");
        setSelected([]);
        await loadDashboard();
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }

    setBusy(false);
  }

  async function closePoll(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to close this poll?"
    );

    if (!confirmed) return;

    const res = await fetch("/api/admin/polls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poll_id: id }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Could not close poll.");
    } else {
      await loadDashboard();
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });

    setAuthenticated(false);
    setMessage("");
  }

  // LOGIN PAGE
  if (!authenticated) {
    return (
      <main className="admin-login-page">
        <a href="/" className="admin-back-link">
          <span>←</span> Back to website
        </a>

        <div className="admin-login-card">
          <div className="admin-login-icon">BA</div>

          <p className="admin-eyebrow">BEAST ARMAGEDDON AOW3</p>

          <h1>Welcome back.</h1>

          <p className="admin-login-description">
            Sign in to manage player submissions and community polls.
          </p>

          <form onSubmit={login}>
            <label htmlFor="admin-password">Admin password</label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <button className="admin-primary-button" disabled={busy}>
              {busy ? "Signing in..." : "Access dashboard"}
              <span>→</span>
            </button>

            {message && <p className="admin-message">{message}</p>}
          </form>

          <div className="admin-login-footer">
            <span className="admin-status-dot" />
            Protected administrator access
          </div>
        </div>
      </main>
    );
  }

  // ADMIN DASHBOARD
  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <a href="/" className="admin-dashboard-brand">
          <span className="admin-brand-icon">BA</span>

          <span>
            <strong>BEAST ARMAGEDDON</strong>
            <small>COMMUNITY CONTROL</small>
          </span>
        </a>

        <div className="admin-header-actions">
          <a href="/" className="admin-secondary-button">
            View website ↗
          </a>

          <button className="admin-logout-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="admin-dashboard-content">
        {/* WELCOME */}
        <section className="admin-welcome">
          <div>
            <p className="admin-eyebrow">ADMINISTRATION</p>

            <h1>
              Dashboard<span>.</span>
            </h1>

            <p>
              Manage submissions, create polls and monitor community votes.
            </p>
          </div>

          <div className="admin-online-indicator">
            <span className="admin-status-dot" />
            ADMIN ACCESS ACTIVE
          </div>
        </section>

        {/* STATISTICS */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <span>PLAYER SUBMISSIONS</span>
            <strong>{submissions.length}</strong>
            <small>Battle entries received</small>
          </div>

          <div className="admin-stat-card">
            <span>PUBLISHED POLLS</span>
            <strong>{polls.length}</strong>
            <small>Community voting polls</small>
          </div>

          <div className="admin-stat-card">
            <span>ACTIVE POLLS</span>
            <strong>{polls.filter((poll) => poll.is_active).length}</strong>
            <small>Currently accepting votes</small>
          </div>
        </section>

        {/* PLAYER SUBMISSIONS */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">01 / PLAYER ENTRIES</p>
              <h2>Submitted battles</h2>
              <p>Select at least two battles to create a poll.</p>
            </div>

            <span className="admin-count-badge">
              {submissions.length} ENTRIES
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="admin-empty-state">
              <div>▧</div>
              <h3>No submissions yet</h3>
              <p>
                Player Battle IDs and screenshots will appear here when
                submitted.
              </p>
            </div>
          ) : (
            <div className="admin-submission-grid">
              {submissions.map((item) => (
                <label
                  className={`admin-submission-card ${
                    selected.includes(item.id) ? "is-selected" : ""
                  }`}
                  key={item.id}
                >
                  <div className="admin-submission-image">
                    <img
                      src={item.image_url}
                      alt={`Screenshot ${item.battle_id}`}
                    />

                    <span className="admin-select-indicator">
                      {selected.includes(item.id) ? "✓" : "+"}
                    </span>
                  </div>

                  <div className="admin-submission-details">
                    <span>BATTLE ID</span>
                    <strong>{item.battle_id}</strong>
                    <small>
                      {new Date(item.created_at).toLocaleString()}
                    </small>
                  </div>

                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        {/* MANUAL BATTLE SUBMISSION */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">02 / MANUAL ENTRY</p>
              <h2>Add a battle manually</h2>
              <p>
                Upload a battle on behalf of a player or add your own gameplay.
              </p>
            </div>

            <span className="admin-step-badge">ADMIN ONLY</span>
          </div>

          <form
            onSubmit={addManualSubmission}
            className="admin-create-form"
          >
            <div className="admin-form-group">
              <label htmlFor="manual-battle-id">Battle ID</label>

              <input
                id="manual-battle-id"
                type="text"
                value={manualBattleId}
                onChange={(e) => setManualBattleId(e.target.value)}
                placeholder="Enter Battle ID"
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="manual-battle-image">
                Battle screenshot
              </label>

              <input
                id="manual-battle-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setManualImage(e.target.files?.[0] ?? null)
                }
                required
              />

              <small className="admin-upload-hint">
                JPG, PNG or WebP. Maximum size: 5MB.
              </small>
            </div>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={manualBusy}
            >
              {manualBusy ? "Adding battle..." : "Add battle"}
              <span>→</span>
            </button>

            {manualMessage && (
              <p className="admin-message">{manualMessage}</p>
            )}
          </form>
        </section>

        {/* CREATE POLL */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">03 / POLL CREATION</p>
              <h2>Create a poll</h2>
              <p>Choose the battles and publish a community vote.</p>
            </div>

            <span className="admin-step-badge">PUBLISH</span>
          </div>

          <form onSubmit={createPoll} className="admin-create-form">
            <div className="admin-form-group">
              <label htmlFor="poll-title">Poll title</label>

              <input
                id="poll-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="Enter poll title"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="poll-description">
                Description <span>OPTIONAL</span>
              </label>

              <textarea
                id="poll-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Tell players what this poll is about..."
              />
            </div>

            <div className="admin-publish-footer">
              <div>
                <strong>{selected.length} battles selected</strong>
                <small>Select at least two submissions above.</small>
              </div>

              <button
                className="admin-primary-button"
                disabled={busy || selected.length < 2}
              >
                {busy ? "Publishing..." : "Publish poll"}
                <span>→</span>
              </button>
            </div>

            {message && <p className="admin-message">{message}</p>}
          </form>
        </section>

        {/* PUBLISHED POLLS */}
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">04 / POLL MANAGEMENT</p>
              <h2>Published polls</h2>
              <p>Manage your existing community polls.</p>
            </div>
          </div>

          {polls.length === 0 ? (
            <div className="admin-empty-state compact">
              <h3>No polls created yet</h3>
              <p>Your published polls will appear here.</p>
            </div>
          ) : (
            <div className="admin-manage-list">
              {polls.map((poll) => (
                <div className="admin-manage-row" key={poll.id}>
                  <div className="admin-manage-icon">▤</div>

                  <div className="admin-manage-info">
                    <strong>{poll.title}</strong>
                    <small>{poll.total_votes} votes received</small>
                  </div>

                  <span
                    className={`admin-poll-status ${
                      poll.is_active ? "active" : "closed"
                    }`}
                  >
                    <span />
                    {poll.is_active ? "ACTIVE" : "CLOSED"}
                  </span>

                  {poll.is_active && (
                    <button
                      className="admin-close-button"
                      onClick={() => closePoll(poll.id)}
                    >
                      Close poll
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="admin-dashboard-footer">
          <span>BEAST ARMAGEDDON AOW3</span>
          <span>COMMUNITY ADMINISTRATION</span>
        </footer>
      </div>
    </main>
  );
}