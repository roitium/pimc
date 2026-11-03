import { SearchIcon } from "lucide-react";
import { memo } from "react";
import { withBase } from "@/utils/paths";

const SearchButton = memo(() => {
  return (
    <a
      href={withBase("/search")}
      className="inline-flex items-center justify-center self-center py-2 md:py-0"
      aria-label="搜索文章"
      title="搜索文章（⌘/Ctrl+K）"
    >
      <SearchIcon className="size-4" />
    </a>
  );
});

SearchButton.displayName = "SearchButton";

export default SearchButton;
