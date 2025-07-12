#!/usr/bin/env node

import chalk from 'chalk';
import { ProgressTracker } from '../core/progress-tracker';

console.log(chalk.cyan('🔍 Claude Code Voice 進捗管理システム'));
console.log(chalk.cyan('====================================='));

const tracker = new ProgressTracker();

// リアルタイム監視開始（3秒ごとに更新）
tracker.watchProgress(3000);