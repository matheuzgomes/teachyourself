import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';

const BASE_PATH = process.env.BASE_PATH ?? '/teachyourself';
const cleanBase = BASE_PATH.replace(/\/$/, '');

function rehypePrefixBase() {
  return (tree) => {
    if (!cleanBase) return;
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a' && node.properties && typeof node.properties.href === 'string') {
        const href = node.properties.href;
        if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith(cleanBase)) {
          node.properties.href = `${cleanBase}${href}`;
        }
      }
    });
  };
}

export default defineConfig({
  site: 'https://matheuzgomes.github.io',
  base: BASE_PATH,
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'css-variables',
        wrap: true,
      },
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypePrefixBase],
    }),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'css-variables',
      wrap: true,
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypePrefixBase],
  },
});
