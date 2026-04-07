"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowSquareOut,
  ArrowsClockwise,
  CloudCheck,
  CloudSlash,
  GithubLogo,
  LinkSimple,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { usePracticeProgressSync } from "@/features/practice/usePracticeProgressSync";
import {
  formatRelativeTime,
  getInitials,
  hasMeaningfulProfileUrl,
  isClerkManagedConnection,
  readNumericMetadata,
  type ClerkConnectionSuggestion,
  type SocialConnection,
} from "@/features/profile/profile-types";
import { useProfileConnections } from "@/features/profile/useProfileConnections";

const panelClass =
  "relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_32%),rgba(9,9,11,0.92)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.55)] backdrop-blur-xl";
const cardClass = "rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-500 focus:border-cyan-400/50 focus:bg-black/40";

function SyncBadge({
  isSignedIn,
  isSyncing,
  syncError,
}: {
  isSignedIn: boolean;
  isSyncing: boolean;
  syncError: string;
}) {
  if (!isSignedIn) {
    return <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300"><CloudSlash size={14} weight="duotone" />Local only</div>;
  }

  if (syncError) {
    return <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200"><WarningCircle size={14} weight="fill" />Sync needs attention</div>;
  }

  if (isSyncing) {
    return <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"><ArrowsClockwise className="animate-spin" size={14} weight="bold" />Syncing now</div>;
  }

  return <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"><CloudCheck size={14} weight="duotone" />Cloud sync active</div>;
}

function StatBox({ label, value, copy }: { label: string; value: string | number; copy: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{copy}</p>
    </div>
  );
}

function SuggestionBanner({
  actionLabel,
  activeAction,
  onImport,
  suggestion,
}: {
  actionLabel: string;
  activeAction: string;
  onImport: () => void;
  suggestion: ClerkConnectionSuggestion;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
      <p className="text-sm font-semibold text-white">{suggestion.displayName || suggestion.handle || "Connected provider found"}</p>
      <p className="mt-2 text-sm leading-6 text-cyan-50/90">{suggestion.headline}</p>
      <button className={`${buttonClass} mt-4 border-cyan-300/30 bg-cyan-300/12 hover:bg-cyan-300/20`} disabled={activeAction !== ""} onClick={onImport} type="button">
        {activeAction ? <ArrowsClockwise className="animate-spin" size={16} weight="bold" /> : <Sparkle size={16} weight="fill" />}
        {actionLabel}
      </button>
    </div>
  );
}

function RepoList({ connection }: { connection: SocialConnection }) {
  return (
    <div className="space-y-3">
      {connection.syncedProjects.slice(0, 4).map((project) => (
        <a key={project.url} className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-all hover:border-cyan-400/30 hover:bg-black/30" href={project.url} rel="noreferrer" target="_blank">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{project.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{project.description || "Fresh repository snapshot synced from GitHub."}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                {project.language ? <span>{project.language}</span> : null}
                <span>{project.stars} stars</span>
                <span>{formatRelativeTime(project.updatedAt)}</span>
              </div>
            </div>
            <ArrowSquareOut className="shrink-0 text-zinc-500" size={16} weight="bold" />
          </div>
        </a>
      ))}
    </div>
  );
}

export function ProfileConnectionsPanel() {
  const { user } = useUser();
  const { isSyncing, progressMap, syncError } = usePracticeProgressSync();
  const { activeAction, clerkSuggestions, connectConnection, connections, disconnectConnection, isLoadingConnections, isSignedIn, panelError, setupRequired } = useProfileConnections();
  const [githubInput, setGithubInput] = useState("");

  const entries = useMemo(() => Object.values(progressMap), [progressMap]);
  const solvedQuestions = entries.filter((entry) => entry.status === "solved").length;
  const trackedQuestions = entries.length;
  const lastPracticeUpdate = entries.map((entry) => entry.updatedAt).sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

  const githubConnection = connections.find((item) => item.provider === "GITHUB") ?? null;
  const githubSuggestion = clerkSuggestions.find((item) => item.provider === "GITHUB") ?? null;
  const githubManaged = isClerkManagedConnection(githubConnection);
  const profileName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.username || "Orbit learner";
  const githubPrefill = githubConnection?.handle || githubConnection?.profileUrl || githubSuggestion?.handle || "";

  return (
    <section className={panelClass}>
      <div className="relative z-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-300">
              <Sparkle className="text-cyan-300" size={12} weight="fill" />
              Profile Sync
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Keep your profile, projects, and cloud progress in one place</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Clerk-connected GitHub can now import in one click, while your real repos also render on the actual profile page.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isLoadingConnections ? <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300"><ArrowsClockwise className="animate-spin" size={14} weight="bold" />Loading connections</div> : null}
            <SyncBadge isSignedIn={Boolean(isSignedIn)} isSyncing={isSyncing} syncError={syncError} />
          </div>
        </div>

        {setupRequired ? <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Run <code className="rounded bg-black/30 px-1.5 py-0.5 text-[13px]">npm run prisma:push</code> once, then refresh this page.</div> : null}
        {panelError ? <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{panelError}</div> : null}

        <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <div className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={profileName} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" src={user.imageUrl} />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-semibold text-white">{getInitials(profileName)}</div>
                )}
                <div>
                  <p className="text-sm text-zinc-400">Signed-in profile</p>
                  <h3 className="text-xl font-semibold text-white">{profileName}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{isSignedIn ? "Your identity, repos, and practice sync now live together." : "Sign in to unlock saved social connections and cloud sync."}</p>
                </div>
              </div>
              <Link className={buttonClass} href="/profile">Open Profile</Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatBox label="Solved sync" value={solvedQuestions} copy="Solved questions mirrored to your cloud profile." />
              <StatBox label="Tracked progress" value={trackedQuestions} copy="Questions with saved state across roadmap and practice." />
              <StatBox label="Latest cloud touch" value={formatRelativeTime(lastPracticeUpdate)} copy={syncError || "Signed-in progress is already wired for multi-device use."} />
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><GithubLogo size={20} weight="fill" />GitHub Sync</div>
            <p className="mt-2 text-sm text-zinc-400">Import from Clerk or sync manually by username.</p>

            {!githubConnection && githubSuggestion ? (
              <div className="mt-4">
                <SuggestionBanner actionLabel="Import from Clerk" activeAction={activeAction} onImport={() => connectConnection({ provider: "GITHUB", useClerkAccount: true }, "connect-GITHUB")} suggestion={githubSuggestion} />
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {githubManaged ? (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
                  GitHub is being sourced from your Clerk account.
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className={buttonClass} disabled={activeAction !== ""} onClick={() => connectConnection({ provider: "GITHUB", useClerkAccount: true }, "refresh-GITHUB")} type="button">Refresh from Clerk</button>
                    <button className={buttonClass} disabled={activeAction !== ""} onClick={() => {
                      setGithubInput("");
                      disconnectConnection("GITHUB");
                    }} type="button">Disconnect</button>
                  </div>
                </div>
              ) : (
                <>
                  <input className={inputClass} disabled={!isSignedIn} onChange={(event) => setGithubInput(event.target.value)} placeholder="github.com/username or username" value={githubInput || githubPrefill} />
                  <div className="flex flex-wrap gap-2">
                    <button className={buttonClass} disabled={!isSignedIn || !(githubInput || githubPrefill).trim() || activeAction !== ""} onClick={() => connectConnection({ identifier: (githubInput || githubPrefill).trim(), provider: "GITHUB" }, githubConnection ? "refresh-GITHUB" : "connect-GITHUB")} type="button">
                      {activeAction === "connect-GITHUB" || activeAction === "refresh-GITHUB" ? <ArrowsClockwise className="animate-spin" size={16} weight="bold" /> : <LinkSimple size={16} weight="bold" />}
                      {githubConnection ? "Refresh projects" : "Connect GitHub"}
                    </button>
                    {githubConnection ? <button className={buttonClass} disabled={activeAction !== ""} onClick={() => {
                      setGithubInput("");
                      disconnectConnection("GITHUB");
                    }} type="button">Disconnect</button> : null}
                  </div>
                </>
              )}
            </div>

            {githubConnection ? (
              <div className="mt-5">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{githubConnection.displayName || githubConnection.handle}</p>
                      <p className="mt-1 text-sm text-zinc-400">{githubConnection.headline}</p>
                    </div>
                    {hasMeaningfulProfileUrl(githubConnection) ? <a className="text-zinc-500 hover:text-cyan-300" href={githubConnection.profileUrl} rel="noreferrer" target="_blank"><ArrowSquareOut size={16} weight="bold" /></a> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{readNumericMetadata(githubConnection.metadata, "followers")} followers</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{readNumericMetadata(githubConnection.metadata, "publicRepos")} repos</span>
                  </div>
                </div>
                <div className="mt-4"><RepoList connection={githubConnection} /></div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
