"use client";

import { useEffect, useState } from "react";

type Option = {
  id: string;
  battle_id: string;
  image_url: string;
  votes: number;
};

type Poll = {
  id: string;
  title: string;
  description: string | null;
  options: Option[];
  total_votes: number;
};

function getVoterKey() {
  const key = "aow3_voter_key";
  let value = localStorage.getItem(key);

  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }

  return value;
}

export default function HomeClient() {
  const [battleId, setBattleId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [voting, setVoting] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, string>>({});

  async function loadPolls() {
    const res = await fetch("/api/polls", { cache: "no-store" });
    const data = await res.json();

    if (res.ok) setPolls(data.polls ?? []);
  }

  useEffect(() => {
    loadPolls();

    const saved: Record<string, string> = {};

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("aow3_voted_")) {
        saved[key.replace("aow3_voted_", "")] =
          localStorage.getItem(key) ?? "";
      }
    }

    setVoted(saved);
  }, []);

  async function submitBattle(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!battleId.trim() || !image) {
      setMessage("Enter your Battle ID and upload a screenshot.");
      return;
    }

    if (!/^image\/(jpeg|png|webp)$/.test(image.type)) {
      setMessage("Use JPG, PNG or WebP.");
      return;
    }

    if (image.size > 5 * 1024 * 1024) {
      setMessage("Maximum image size is 5MB.");
      return;
    }

    setSubmitting(true);

    try {
      const body = new FormData();
      body.append("battle_id", battleId.trim());
      body.append("image", image);

      const res = await fetch("/api/submissions", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setMessage("Battle submitted successfully!");
      setBattleId("");
      setImage(null);

      const input = document.getElementById(
        "battle-image"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function castVote(pollId: string, optionId: string) {
    setVoting(optionId);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poll_id: pollId,
          option_id: optionId,
          voter_key: getVoterKey(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Vote could not be recorded.");
      }

      localStorage.setItem(`aow3_voted_${pollId}`, optionId);

      setVoted((old) => ({
        ...old,
        [pollId]: optionId,
      }));

      await loadPolls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Vote failed.");
    } finally {
      setVoting(null);
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-name">BEAST ARMAGEDDON AOW3</span>
        </a>

        <nav className="main-nav">
          <a href="#polls">Polls</a>
          <a href="#submit">Submit Battle</a>
        </nav>

        <a className="admin-link" href="/admin">
          Admin <span>↗</span>
        </a>
      </header>

      <section className="intro-row">
        <div>
          <span className="eyebrow">COMMUNITY</span>
          <h2>Showcase your battles.</h2>
        </div>

        <p>
          Submit your Battle ID and screenshot for a chance to be featured.
        </p>
      </section>

      <section className="content-grid">
        <div className="panel submit-panel" id="submit">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SUBMIT GAMEPLAY</span>
              <h2>Submit a battle</h2>
            </div>

            <span className="number-tag">01</span>
          </div>

          <form onSubmit={submitBattle} className="submit-form">
            <div className="input-group">
              <label htmlFor="battle-id">Battle ID</label>

              <input
                id="battle-id"
                value={battleId}
                onChange={(e) => setBattleId(e.target.value)}
                placeholder="Enter Battle ID"
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label>Screenshot</label>

              <label className="upload-box" htmlFor="battle-image">
                <span className="upload-icon">↑</span>

                <strong>
                  {image ? image.name : "Choose screenshot"}
                </strong>

                <small>JPG, PNG or WebP · Max 5MB</small>

                <input
                  id="battle-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setImage(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            <button className="primary-button" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Battle"}
              <span>→</span>
            </button>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
          </form>

          <div className="privacy-note">
            No account required. Selection is not guaranteed.
          </div>
        </div>

        <div className="side-note">
          <span className="eyebrow">HOW IT WORKS</span>

          <h2>Three steps.</h2>

          <div className="steps">
            <div className="step-item">
              <span className="step-number">01</span>
              <div>
                <strong>Submit</strong>
                <p>Send your Battle ID and screenshot.</p>
              </div>
            </div>

            <div className="step-item">
              <span className="step-number">02</span>
              <div>
                <strong>Get featured</strong>
                <p>Selected battles appear in polls.</p>
              </div>
            </div>

            <div className="step-item">
              <span className="step-number">03</span>
              <div>
                <strong>Get votes</strong>
                <p>Let the community decide.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="poll-section" id="polls">
        <div className="section-heading poll-heading">
          <div>
            <span className="eyebrow">VOTE</span>
            <h2>Community polls</h2>
            <p className="muted">Choose your favourite battle.</p>
          </div>

          <span className="poll-status">
            <i /> LIVE VOTING
          </span>
        </div>

        {polls.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <h3>No polls available</h3>
            <p>Check back when a new poll is published.</p>
          </div>
        ) : (
          <div className="poll-list">
            {polls.map((poll) => {
              const selected = voted[poll.id];

              return (
                <article className="poll-card" key={poll.id}>
                  <div className="poll-card-head">
                    <div>
                      <span className="eyebrow">COMMUNITY VOTE</span>
                      <h3>{poll.title}</h3>

                      {poll.description && (
                        <p className="muted">{poll.description}</p>
                      )}
                    </div>

                    <span className="vote-count">
                      {poll.total_votes} votes
                    </span>
                  </div>

                  <div className="option-grid">
                    {poll.options.map((option) => {
                      const percent = poll.total_votes
                        ? Math.round(
                            (option.votes / poll.total_votes) * 100
                          )
                        : 0;

                      return (
                        <div
                          className={`option-card ${
                            selected === option.id ? "chosen" : ""
                          }`}
                          key={option.id}
                        >
                          <div className="option-image">
                            <img
                              src={option.image_url}
                              alt={`Battle ${option.battle_id}`}
                            />

                            {selected === option.id && (
                              <span className="your-vote">
                                YOUR VOTE
                              </span>
                            )}
                          </div>

                          <div className="option-info">
                            <span className="option-id">BATTLE ID</span>
                            <strong>{option.battle_id}</strong>
                          </div>

                          <div className="vote-meter">
                            <span style={{ width: `${percent}%` }} />
                          </div>

                          <div className="vote-meta">
                            <span>{option.votes} votes</span>
                            <b>{percent}%</b>
                          </div>

                          <button
                            className="vote-button"
                            disabled={!!selected || voting !== null}
                            onClick={() =>
                              castVote(poll.id, option.id)
                            }
                          >
                            {voting === option.id
                              ? "Voting..."
                              : selected === option.id
                              ? "Voted ✓"
                              : selected
                              ? "Already voted"
                              : "Vote"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {selected && (
                    <p className="voted-note">
                      Your vote has been recorded.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <span>BEAST ARMAGEDDON AOW3</span>
        </div>

        <p>Art of War 3 Community</p>
      </footer>
    </main>
  );
}