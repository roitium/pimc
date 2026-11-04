import type { APIRoute } from "astro";
import site from "@/data/siteMetadata";
import { generateOG } from "@/services/og";

export const prerender = true;

export const GET: APIRoute = () =>
  generateOG({ title: site.title, description: site.description });
