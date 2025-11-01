"use client";

import { useEffect, useState } from "react";
import Header from "../main components/stickyheader";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Personal() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col overflow-hidden">
      <Header currentRoute="personal" />
      {isLoading && (
        <div className="flex flex-col justify-center min-h-screen">
          <Loader2 className="animate-spin self-center justify-self-center" />
        </div>
      )}
      {!isLoading && (
        <section className="flex flex-col w-full px-6 py-12 sm:px-10 bg-background min-h-screen">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
          </div>

          <div className="mx-auto w-full max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-0 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Personal
            </motion.h2>
            <span className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
              See what make me me (WIP)
            </span>
          </div>
          <div className="w-full xl:w-[60%] self-center mt-6">
            <SpotifyEmbed
              link={
                "https://open.spotify.com/album/1xyO6rgO44G5BYpljc11l4?si=eOgn25WNSsypusqu3musIw"
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

// SpotifyEmbed.tsx
import React from "react";

type SpotifyType =
  | "track"
  | "album"
  | "playlist"
  | "artist"
  | "episode"
  | "show";

function parseSpotify(input: string): { type: SpotifyType; id: string } | null {
  // Matches https://open.spotify.com/{type}/{id} or spotify:{type}:{id}
  const urlMatch = input.match(
    /open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/i
  );
  if (urlMatch) return { type: urlMatch[1] as SpotifyType, id: urlMatch[2] };

  const uriMatch = input.match(
    /^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]+)$/i
  );
  if (uriMatch) return { type: uriMatch[1] as SpotifyType, id: uriMatch[2] };

  return null;
}

const defaultHeights: Record<SpotifyType, number> = {
  track: 152,
  album: 500,
  playlist: 352,
  artist: 352,
  episode: 232, // podcast episode
  show: 232, // podcast show
};

export interface SpotifyEmbedProps
  extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  /** Full Spotify URL or URI */
  link: string;
  /** Height override (optional) */
  heightOverride?: number;
  /** Rounded corners (on by default) */
  rounded?: boolean;
}

export const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({
  link,
  heightOverride,
  rounded = true,
  style,
  ...iframeProps
}) => {
  const parsed = parseSpotify(link);
  if (!parsed) return null;

  const { type, id } = parsed;
  const src = `https://open.spotify.com/embed/${type}/${id}`;

  const height = heightOverride ?? defaultHeights[type];

  return (
    <iframe
      title={`Spotify ${type}`}
      src={src}
      width="100%"
      height={height}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: rounded ? 12 : 0, ...style }}
      className="self-center "
      {...iframeProps}
    />
  );
};
