#!/usr/bin/env node

import chalk from 'chalk';
import { ErrorDetector } from '../core/error-detector';

console.log(chalk.cyan('🔍 Claude Code Voice エラー監視システム'));
console.log(chalk.cyan('======================================'));

const detector = new ErrorDetector();

// First, check current errors
const summaries = detector.checkAllAgents();
detector.displayErrorReport(summaries);

console.log(chalk.yellow('\n💡 リアルタイム監視を開始します...'));
console.log(chalk.yellow('新しいエラーが検出されたら通知されます'));

// Start watching for new errors
detector.watchForErrors();