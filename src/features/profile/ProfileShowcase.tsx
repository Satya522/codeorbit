"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowClockwise,
  ArrowRight,
  ArrowSquareOut,
  CheckCircle,
  CameraPlus,
  CloudSlash,
  EnvelopeSimple,
  GithubLogo,
  GoogleLogo,
  LinkedinLogo,
  Phone,
  ShieldCheck,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { usePracticeProgressSync } from "@/features/practice/usePracticeProgressSync";
import {
  formatRelativeTime,
  getInitials,
  hasMeaningfulProfileUrl,
  readNumericMetadata,
} from "@/features/profile/profile-types";
import { useProfileConnections } from "@/features/profile/useProfileConnections";

const shellClass =
  "relative min-h-full bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_22%),#050816] text-white";
const cardClass = "rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_70px_rgba(2,6,23,0.32)] backdrop-blur-xl";

function resolveProviderLabel(provider: string) {
  const normalized = provider.toLowerCase();

  if (normalized.includes("github")) {
    return "GitHub";
  }

  if (normalized.includes("linkedin")) {
    return "LinkedIn";
  }

  if (normalized.includes("google")) {
    return "Google";
  }

  return normalized
    .replace(/^oauth_/, "")
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ProfileShowcase() {
  const { user } = useUser();
  const { progressMap } = usePracticeProgressSync();
  const { connections, isLoadingConnections, isSignedIn, panelError, setupRequired } = useProfileConnections();
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreviewUrl, setPendingPhotoPreviewUrl] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [showPhotoAfterglow, setShowPhotoAfterglow] = useState(false);

  const githubConnection = connections.find((item) => item.provider === "GITHUB") ?? null;
  const linkedinConnection = connections.find((item) => item.provider === "LINKEDIN") ?? null;
  const progressEntries = useMemo(() => Object.values(progressMap), [progressMap]);
  const solvedCount = progressEntries.filter((item) => item.status === "solved").length;
  const socialProviders = useMemo(() => {
    const seen = new Set<string>();

    return (user?.externalAccounts ?? []).flatMap((account) => {
      const label = resolveProviderLabel(account.provider);
      const key = label.toLowerCase();

      if (seen.has(key)) {
        return [];
      }

      seen.add(key);

      return [
        {
          detail: account.emailAddress || account.username || account.providerUserId,
          label,
        },
      ];
    });
  }, [user]);
  const emailAddresses = user?.emailAddresses ?? [];
  const phoneNumbers = user?.phoneNumbers ?? [];
  const identityMethodCount = socialProviders.length + emailAddresses.length + phoneNumbers.length;
  const profileName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Orbit learner";
  const profileHandle = user?.username
    ? `@${user.username}`
    : user?.primaryEmailAddress?.emailAddress || "Signed-in learner";

  useEffect(() => {
    if (!pendingPhotoPreviewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(pendingPhotoPreviewUrl);
    };
  }, [pendingPhotoPreviewUrl]);

  useEffect(() => {
    if (!showPhotoAfterglow) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowPhotoAfterglow(false);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [showPhotoAfterglow]);

  function clearPhotoPreview() {
    setPendingPhotoFile(null);
    setPendingPhotoPreviewUrl("");
  }

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];

    if (!nextFile || !user) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file.");
      setPhotoMessage("");
      event.target.value = "";
      return;
    }

    if (nextFile.size > 5 * 1024 * 1024) {
      setPhotoError("Please keep the image under 5MB.");
      setPhotoMessage("");
      event.target.value = "";
      return;
    }

    setPhotoError("");
    setPhotoMessage("");
    setPendingPhotoFile(nextFile);
    setPendingPhotoPreviewUrl(URL.createObjectURL(nextFile));
    event.target.value = "";
  }

  async function saveProfilePhoto() {
    if (!pendingPhotoFile || !user) {
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError("");
    setPhotoMessage("");

    try {
      await user.setProfileImage({ file: pendingPhotoFile });
      await user.reload();
      clearPhotoPreview();
      setPhotoMessage("Profile photo updated successfully.");
      setShowPhotoAfterglow(true);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Unable to update your profile photo right now.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <div className={shellClass}>
      <div className="mx-auto max-w-[1380px] space-y-6 p-5 sm:p-6 lg:p-8">
        <div className={cardClass}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className={`absolute -inset-2 rounded-[30px] bg-[radial-gradient(circle,rgba(103,232,249,0.24),rgba(124,58,237,0.14),transparent_72%)] blur-xl transition-opacity duration-500 ${showPhotoAfterglow || pendingPhotoPreviewUrl ? "opacity-100" : "opacity-0"}`} />
                <div className={`relative rounded-[30px] bg-[linear-gradient(135deg,rgba(103,232,249,0.55),rgba(124,58,237,0.5))] p-[1.5px] transition-transform duration-300 ${pendingPhotoPreviewUrl ? "scale-[1.03]" : ""}`}>
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1120]">
                    {pendingPhotoPreviewUrl || user?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={profileName}
                        className="h-24 w-24 object-cover"
                        src={pendingPhotoPreviewUrl || user?.imageUrl || ""}
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center bg-white/[0.04] text-[1.75rem] font-semibold">
                        {getInitials(profileName)}
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)] opacity-70" />
                  </div>
                </div>
                {isSignedIn ? (
                  <button
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#0f172a] text-cyan-200 shadow-[0_16px_40px_rgba(2,6,23,0.4)] transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isUploadingPhoto}
                    onClick={() => profileImageInputRef.current?.click()}
                    type="button"
                  >
                    {isUploadingPhoto ? <ArrowClockwise size={18} weight="bold" className="animate-spin" /> : <CameraPlus size={18} weight="bold" />}
                  </button>
                ) : null}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-zinc-300">
                  <Sparkle size={12} weight="fill" className="text-cyan-300" />
                  Public Profile Surface
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{profileName}</h1>
                <p className="mt-1 text-sm font-medium text-cyan-200">{profileHandle}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  This page now renders the real profile surface for your signed-in user, including synced GitHub repos,
                  LinkedIn profile signals, and live practice progress.
                </p>
                {isSignedIn ? (
                  <div className="mt-4 space-y-2">
                    <input
                      ref={profileImageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoChange}
                      type="file"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isUploadingPhoto}
                        onClick={() => profileImageInputRef.current?.click()}
                        type="button"
                      >
                        {isUploadingPhoto ? <ArrowClockwise size={16} weight="bold" className="animate-spin" /> : <CameraPlus size={16} weight="bold" className="text-cyan-300" />}
                        {pendingPhotoPreviewUrl ? "Replace preview" : isUploadingPhoto ? "Uploading photo..." : "Change profile photo"}
                      </button>
                      <span className="text-xs text-zinc-500">PNG, JPG, WEBP up to 5MB</span>
                    </div>
                    {pendingPhotoPreviewUrl ? (
                      <div className="mt-3 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-3 shadow-[0_18px_60px_rgba(8,145,178,0.12)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(103,232,249,0.45),rgba(124,58,237,0.42))] p-[1.5px]">
                              <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0b1120]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="Selected profile preview" className="h-16 w-16 object-cover" src={pendingPhotoPreviewUrl} />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Preview ready</p>
                              <p className="text-xs text-cyan-50/80">Check the crop-style avatar preview, then save it to Clerk.</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(103,232,249,0.95),rgba(124,58,237,0.9))] px-4 py-2 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isUploadingPhoto}
                              onClick={saveProfilePhoto}
                              type="button"
                            >
                              {isUploadingPhoto ? <ArrowClockwise size={16} weight="bold" className="animate-spin" /> : <CheckCircle size={16} weight="fill" />}
                              {isUploadingPhoto ? "Saving..." : "Save photo"}
                            </button>
                            <button
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.04]"
                              disabled={isUploadingPhoto}
                              onClick={clearPhotoPreview}
                              type="button"
                            >
                              <X size={16} weight="bold" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {photoMessage ? (
                      <p className="inline-flex items-center gap-2 text-sm text-emerald-200">
                        <CheckCircle size={16} weight="fill" className="text-emerald-300" />
                        {photoMessage}
                      </p>
                    ) : null}
                    {photoError ? (
                      <p className="inline-flex items-center gap-2 text-sm text-rose-200">
                        <WarningCircle size={16} weight="fill" className="text-rose-300" />
                        {photoError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Solved</p>
                <p className="mt-2 text-2xl font-semibold">{solvedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">GitHub repos</p>
                <p className="mt-2 text-2xl font-semibold">{githubConnection?.syncedProjects.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Login methods</p>
                <p className="mt-2 text-2xl font-semibold">{identityMethodCount}</p>
              </div>
            </div>
          </div>
        </div>

        {!isSignedIn ? (
          <div className={cardClass}>
            <p className="text-sm text-zinc-300">Sign in first, then connect GitHub from your workspace.</p>
            <div className="mt-4">
              <Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10" href="/sign-in">
                Open Sign In
              </Link>
            </div>
          </div>
        ) : null}

        {setupRequired ? <div className={`${cardClass} border-amber-400/20 bg-amber-400/10 text-amber-100`}>Run <code className="rounded bg-black/30 px-1.5 py-0.5 text-[13px]">npm run prisma:push</code> once, then refresh this page.</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <GithubLogo size={22} weight="fill" />
                GitHub Projects
              </div>
              {githubConnection ? <span className="text-xs text-zinc-500">Updated {formatRelativeTime(githubConnection.lastSyncedAt)}</span> : null}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {githubConnection
                    ? "These repositories are now part of the actual profile page, not just the workspace setup panel."
                    : "Connect GitHub from the workspace to render synced repositories here."}
            </p>
            {panelError ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {panelError}
              </div>
            ) : null}

            {isLoadingConnections ? <p className="mt-4 text-sm text-zinc-500">Loading profile connections...</p> : null}

            {githubConnection ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {githubConnection.syncedProjects.map((project) => (
                  <a key={project.url} className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:border-cyan-400/30 hover:bg-black/30" href={project.url} rel="noreferrer" target="_blank">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{project.name}</p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{project.description || "Fresh repository snapshot synced from GitHub."}</p>
                      </div>
                      <ArrowSquareOut className="shrink-0 text-zinc-500" size={16} weight="bold" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                      {project.language ? <span>{project.language}</span> : null}
                      <span>{project.stars} stars</span>
                      <span>{project.forks} forks</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : null}

            {!githubConnection && !isLoadingConnections ? (
              <div className="mt-5 flex min-h-[300px] items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-black/20 px-6 py-8 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <CloudSlash size={24} weight="duotone" className="text-cyan-300" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">GitHub not connected yet</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    This section was looking empty because no repo sync existed yet. Connect GitHub once and your repositories will appear here.
                  </p>
                  <div className="mt-5">
                    <Link
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      href="/dashboard"
                    >
                    Open workspace sync
                      <ArrowRight size={16} weight="bold" className="text-cyan-300" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck size={22} weight="fill" className="text-emerald-300" />
                  Clerk Identity
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                  Synced from login
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                GitHub, LinkedIn, Google, email, aur phone jo bhi Clerk par connected hai, wo yahan live render hoga.
              </p>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Social login</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {socialProviders.length > 0 ? socialProviders.map((provider) => (
                      <div key={provider.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">
                        {provider.label === "GitHub" ? <GithubLogo size={16} weight="fill" /> : null}
                        {provider.label === "LinkedIn" ? <LinkedinLogo size={16} weight="fill" className="text-sky-300" /> : null}
                        {provider.label === "Google" ? <GoogleLogo size={16} weight="fill" className="text-sky-300" /> : null}
                        <span>{provider.label}</span>
                        {provider.detail ? <span className="text-xs text-zinc-400">{provider.detail}</span> : null}
                      </div>
                    )) : <p className="text-sm text-zinc-500">No social provider connected yet.</p>}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Email addresses</p>
                  <div className="mt-3 space-y-2">
                    {emailAddresses.length > 0 ? emailAddresses.map((email) => (
                      <div key={email.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-zinc-200">
                          <EnvelopeSimple size={16} weight="duotone" className="text-cyan-300" />
                          <span>{email.emailAddress}</span>
                        </div>
                        {email.id === user?.primaryEmailAddressId ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">Primary</span> : null}
                      </div>
                    )) : <p className="text-sm text-zinc-500">No email address available.</p>}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Phone numbers</p>
                  <div className="mt-3 space-y-2">
                    {phoneNumbers.length > 0 ? phoneNumbers.map((phone) => (
                      <div key={phone.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-zinc-200">
                          <Phone size={16} weight="duotone" className="text-violet-300" />
                          <span>{phone.phoneNumber}</span>
                        </div>
                        {phone.id === user?.primaryPhoneNumberId ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">Primary</span> : null}
                      </div>
                    )) : <p className="text-sm text-zinc-500">No phone number added yet.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold">Profile Signals</p>
                <Link className="text-sm font-medium text-cyan-300 hover:text-cyan-200" href="/dashboard">
                Manage in workspace
                </Link>
              </div>
              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <p>GitHub followers visible: <span className="font-medium text-white">{readNumericMetadata(githubConnection?.metadata ?? null, "followers")}</span></p>
                <p>GitHub public repos visible: <span className="font-medium text-white">{readNumericMetadata(githubConnection?.metadata ?? null, "publicRepos")}</span></p>
                <p>GitHub sync status: <span className="font-medium text-white">{githubConnection ? "GitHub connected" : "Waiting for GitHub sync"}</span></p>
                <p>LinkedIn sync status: <span className="font-medium text-white">{linkedinConnection ? "LinkedIn connected" : "Waiting for LinkedIn sync"}</span></p>
                {linkedinConnection && hasMeaningfulProfileUrl(linkedinConnection) ? (
                  <p>
                    LinkedIn profile:{" "}
                    <a
                      className="font-medium text-cyan-300 hover:text-cyan-200"
                      href={linkedinConnection.profileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open profile
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
