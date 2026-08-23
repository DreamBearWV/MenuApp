import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/MenuApp/', // ⚠️ 請改為你的 GitHub 儲存庫名稱，前後都要有斜線
})