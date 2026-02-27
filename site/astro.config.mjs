// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://seanking11.github.io',
  base: '/gamebootcamp/',
  integrations: [mdx()],
});
