import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.string(),
    description: z.string().trim().min(40).max(160).optional(),
    image: image().optional(),
  }),
});

export const collections = { blog };
