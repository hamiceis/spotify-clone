"use client"

import { Song } from "../../../types"
import useOnPlay from "@/hooks/useOnPlay";

import { MidiaItem } from "@/components/MidiaItem"
import { LikeButton } from "@/components/LikeButton"


interface SearchContentProps {
  songs: Song[];
}

export function SearchContent({ songs } :SearchContentProps){
  const onPlay = useOnPlay(songs);

  if(songs.length === 0) {
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        No songs found.
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-y-2 w-full px-6">
      {songs.map((song) => {
        return (
          <div 
          key={song.id}
          className="flex items-center gap-x-4 w-full"
          >
            <div
            className="flex-1"
            >
              <MidiaItem onClick={(id: string) => onPlay(id)} data={song} />
            </div>
            {/* TODO:  Add Like button here */}
            <LikeButton songId={song.id} />
          </div>
        )
      })}
    </div>
  )
}