#!/usr/bin/env node
/*
  ChatSaid Tidy Script
  - Sorts package.json keys deterministically
  - Runs ESLint with --fix over the workspace
  - Runs TypeScript type-check (no emit)
  - Optionally runs Jest and Playwright if enabled via env flags

  Usage:
    node scripts/tidy.js

  Env flags:
    TIDY_RUN_TESTS=1       -> run Jest
    TIDY_RUN_E2E=1         -> run Playwright tests
    TIDY_ESLINT_PATTERN="app components lib services scripts"
*/

const { spawn } = require('child_process')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')

function log(step, msg) { console.log(`\x1b[36m[tidy:${step}]\x1b[0m ${msg}`) }
function warn(step, msg) { console.warn(`\x1b[33m[tidy:${step}]\x1b[0m ${msg}`) }

async function runCmd(step, bin, args, opts = {}) {
  log(step, `${bin} ${args.join(' ')}`)
  return new Promise((resolve) => {
    const proc = spawn(bin, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts })
    proc.on('exit', (code) => {
      if (code !== 0) warn(step, `exit code ${code}`)
      resolve(code)
    })
  })
}

function sortObject(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return o
  const sorted = {}
  Object.keys(o).sort((a,b) => a.localeCompare(b)).forEach(k => { sorted[k] = o[k] })
  return sorted
}

function sortPackageJson() {
  const pkgPath = join(process.cwd(), 'package.json')
  if (!existsSync(pkgPath)) return log('pkg', 'package.json not found, skipping')
  const raw = readFileSync(pkgPath, 'utf8')
  const json = JSON.parse(raw)
  const order = ['name','version','description','private','license','author','engines','keywords','scripts','dependencies','devDependencies']
  const out = {}
  for (const k of order) { if (json[k] !== undefined) out[k] = json[k] }
  // Keep any remaining keys
  Object.keys(json).forEach(k => { if (out[k] === undefined) out[k] = json[k] })
  // Alphabetize nested maps
  if (out.dependencies) out.dependencies = sortObject(out.dependencies)
  if (out.devDependencies) out.devDependencies = sortObject(out.devDependencies)
  if (out.scripts) out.scripts = sortObject(out.scripts)
  writeFileSync(pkgPath, JSON.stringify(out, null, 2) + '\n')
  log('pkg', 'sorted package.json')
}

async function main() {
  sortPackageJson()

  const eslintBin = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint')
  const tscBin = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')
  const jestBin = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'jest.cmd' : 'jest')
  const pwBin = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright')

  const patterns = (process.env.TIDY_ESLINT_PATTERN || 'app components lib services scripts').split(/\s+/).filter(Boolean)
  if (existsSync(eslintBin)) {
    await runCmd('eslint', eslintBin, ['--fix', '--max-warnings=0', '--ext', '.js,.jsx,.ts,.tsx', ...patterns])
  } else warn('eslint', 'eslint not found (skipping)')

  if (existsSync(tscBin)) {
    await runCmd('tsc', tscBin, ['-p', './', '--noEmit'])
  } else warn('tsc', 'typescript not found (skipping)')

  if (process.env.TIDY_RUN_TESTS === '1') {
    if (existsSync(jestBin)) {
      await runCmd('jest', jestBin, [])
    } else warn('jest', 'jest not found (skipping)')
  }

  if (process.env.TIDY_RUN_E2E === '1') {
    if (existsSync(pwBin)) {
      await runCmd('e2e', pwBin, ['test', '--reporter=list'])
    } else warn('e2e', 'playwright not found (skipping)')
  }

  log('done', 'tidy complete')
}

main().catch((e) => { console.error(e); process.exit(1) })

