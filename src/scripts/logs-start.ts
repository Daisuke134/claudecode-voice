#!/usr/bin/env node

import chalk from 'chalk';
import { LogCollector } from '../core/log-collector';

const collector = new LogCollector();

// Keep the process running
let isRunning = true;

function main() {
  console.log(chalk.cyan('🔍 Claude Code Voice ログ収集システム'));
  console.log(chalk.cyan('====================================='));
  
  collector.startCollecting();
  
  console.log(chalk.yellow('\n💡 ヒント:'));
  console.log('  - 別のターミナルで npm run logs:status で状態確認');
  console.log('  - 別のターミナルで npm run logs:view <agent> でログ表示');
  console.log('  - Ctrl+C でログ収集を停止');
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🛑 ログ収集を停止しています...'));
    collector.stopCollecting();
    isRunning = false;
    process.exit(0);
  });

  // Keep the process running
  setInterval(() => {
    if (!isRunning) {
      process.exit(0);
    }
  }, 1000);
}

main();