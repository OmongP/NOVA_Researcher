import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 검색 요청은 로컬 프록시 서버(server/index.js)로 넘겨요.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
