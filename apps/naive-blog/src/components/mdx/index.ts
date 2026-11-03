import Image from "./Image.astro";
import TOCInline from "./TOC.astro";
import Link from "./Link.astro";
import Pre from "./Pre.astro";
import Table from "./Table.astro";
export const components = {
  Image,
  TOCInline,
  a: Link,
  pre: Pre,
  table: Table,
};
