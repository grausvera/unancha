export const docsFrameworks = [
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "vue", label: "Vue", condition: "unancha-vue" },
  { id: "nuxt", label: "Nuxt", snippet: "vue" },
  { id: "svelte", label: "Svelte", condition: "unancha-svelte" },
  { id: "sveltekit", label: "SvelteKit", condition: "unancha-svelte", snippet: "svelte" },
  { id: "astro", label: "Astro", condition: "unancha-astro" },
  { id: "angular", label: "Angular", condition: "unancha-angular" },
  { id: "web", label: "JavaScript", condition: "unancha-web" },
] as const;

export type DocsFramework = typeof docsFrameworks[number];
