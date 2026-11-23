import { defineConfig, type Plugin } from 'vite';
import { renderBook } from './src/render/book';

/** Pre-renders the whole book into index.html (dev and build), so content is in the HTML. */
function prerenderBook(): Plugin {
  return {
    name: 'marginalia-prerender',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace('<!--book-->', renderBook());
      },
    },
  };
}

export default defineConfig({
  plugins: [prerenderBook()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
  },
});
