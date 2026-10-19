import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    // 검색 요청은 로컬 프록시 서버(server/index.js)로 넘겨요.
    proxy: { '/api': 'http://localhost:8787' },
  },
  // 데모 빌드(npm run build:demo)는 공개 사이트용이에요. 서버가 없어서 화면 검색은 미리 모은 데이터를 써요.
  ...(mode === 'demo' && {
    resolve: {
      alias: [
        // 데모는 서버가 없어서 UI Bowl에서 미리 모아 둔 화면(demoScreens.js)으로 검색해요.
        {
          find: /^(\.\.?\/)+data\/sampleScreens$/,
          replacement: fileURLToPath(new URL('./src/data/demoScreens.js', import.meta.url)),
        },
      ],
    },
    build: { outDir: 'dist-demo' },
  }),
}))
