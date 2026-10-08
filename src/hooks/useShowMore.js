import { useState } from "react";

// Shows the first `limit` items until the visitor expands the list.
export function useShowMore(items, limit) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > limit;
  return {
    shown: hasMore && !expanded ? items.slice(0, limit) : items,
    hasMore,
    expanded,
    hidden: items.length - limit,
    limit,
    toggle: () => setExpanded((value) => !value),
  };
}
