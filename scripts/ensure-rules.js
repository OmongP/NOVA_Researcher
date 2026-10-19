// 규칙 파일이 없으면 공개용 예시를 복사해 둬요.
// 실제 사내 가이드는 src/data/darkPatternRules.js 에 두고, 그 파일은 git에 올리지 않아요.
import { copyFileSync, existsSync } from 'node:fs'

const target = new URL('../src/data/darkPatternRules.js', import.meta.url)
const example = new URL('../src/data/darkPatternRules.example.js', import.meta.url)

if (!existsSync(target)) {
  copyFileSync(example, target)
  console.log('[rules] src/data/darkPatternRules.js 가 없어 예시 규칙을 복사했어요.')
}
