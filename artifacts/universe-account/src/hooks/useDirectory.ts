import { useState, useMemo, useCallback } from "react";
import { DIRECTORY_USERS } from "@/lib/mock/directoryMock";
import { DirectoryUser, DirectoryFilter, SortOption } from "@/lib/types/directory";

function scoreForFilter(user: DirectoryUser, filter: DirectoryFilter): number {
  switch (filter) {
    case "top_creators": return user.creatorScore;
    case "top_traders": return user.traderScore;
    case "top_breeders": return user.breederScore;
    case "top_football_managers": return user.footballScore;
    default: return user.reputation * 100 + user.level;
  }
}

export function useDirectory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DirectoryFilter>("all");
  const [sort, setSort] = useState<SortOption>("reputation");

  const filtered = useMemo<DirectoryUser[]>(() => {
    let list = [...DIRECTORY_USERS];

    // text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.universeId.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q)
      );
    }

    // sort
    list.sort((a, b) => {
      if (filter !== "all") return scoreForFilter(b, filter) - scoreForFilter(a, filter);
      if (sort === "level") return b.level - a.level;
      if (sort === "recent") return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      return b.reputation - a.reputation;
    });

    return list;
  }, [search, filter, sort]);

  // ranked lists (top 10 per category)
  const topCreators = useMemo(() =>
    [...DIRECTORY_USERS].sort((a, b) => b.creatorScore - a.creatorScore).slice(0, 10), []);
  const topTraders = useMemo(() =>
    [...DIRECTORY_USERS].sort((a, b) => b.traderScore - a.traderScore).slice(0, 10), []);
  const topBreeders = useMemo(() =>
    [...DIRECTORY_USERS].sort((a, b) => b.breederScore - a.breederScore).slice(0, 10), []);
  const topFootball = useMemo(() =>
    [...DIRECTORY_USERS].sort((a, b) => b.footballScore - a.footballScore).slice(0, 10), []);

  const clearSearch = useCallback(() => setSearch(""), []);

  return {
    search, setSearch, clearSearch,
    filter, setFilter,
    sort, setSort,
    filtered,
    topCreators, topTraders, topBreeders, topFootball,
    totalCount: DIRECTORY_USERS.length,
    onlineCount: DIRECTORY_USERS.filter(u => u.isOnline).length,
  };
}
