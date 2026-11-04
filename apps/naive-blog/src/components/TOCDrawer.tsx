import { TableOfContents } from "lucide-react";
import { useState } from "react";
import TOCInline, { type TOCInlineProps } from "./TOC";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

type TOCDrawerProps = TOCInlineProps;

export const TOCDrawer = ({ toc, ...props }: TOCDrawerProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        aria-label="打开目录"
        className="flex size-11 items-center justify-center rounded-full bg-gray-200 text-gray-500 shadow-sm transition-colors hover:bg-gray-300 lg:hidden dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
      >
        <TableOfContents className="size-5" />
      </DrawerTrigger>
      <DrawerContent aria-describedby={undefined} className="max-h-[85dvh]">
        <DrawerHeader className="text-center sm:text-center">
          <DrawerTitle>目录</DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          <TOCInline
            toc={toc}
            {...props}
            showProgress={false}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
