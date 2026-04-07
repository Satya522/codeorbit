import Image from "next/image";
import type { PracticePlatformInfo } from "@/lib/types/question-catalog";

type PlatformIconProps = {
  platform: PracticePlatformInfo;
};

export function PlatformIcon({ platform }: PlatformIconProps) {
  if (platform.iconSrc) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 p-1"
        title={platform.displayName}
      >
        <Image
          alt={platform.displayName}
          className="h-full w-full rounded-full object-contain"
          src={platform.iconSrc}
          height={24}
          width={24}
        />
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 px-2 text-[10px] font-semibold tracking-[0.18em] text-zinc-200"
      title={platform.displayName}
    >
      {platform.fallbackLabel}
    </span>
  );
}

export function PlatformIconStack({ platforms }: { platforms: PracticePlatformInfo[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {platforms.map((platform) => (
        <PlatformIcon key={platform.slug} platform={platform} />
      ))}
    </div>
  );
}
