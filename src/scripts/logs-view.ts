#!/usr/bin/env node

import chalk from 'chalk';
import { LogCollector } from '../core/log-collector';
import { Command } from 'commander';

const program = new Command();

program
  .name('logs-view')
  .description('View agent logs')
  .version('0.1.0')
  .argument('[agent]', 'Agent name (boss, worker1, worker2)')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action((agent, options) => {
    const collector = new LogCollector();

    if (!agent) {
      console.error(chalk.red('❌ エラー: エージェント名を指定してください'));
      console.log('');
      console.log('使用方法:');
      console.log('  npm run logs:view <agent>');
      console.log('  npm run logs:view boss');
      console.log('  npm run logs:view worker1 -- --lines 100');
      process.exit(1);
    }

    const validAgents = ['boss', 'worker1', 'worker2'];
    if (!validAgents.includes(agent)) {
      console.error(chalk.red(`❌ エラー: 無効なエージェント名: ${agent}`));
      console.log(`有効なエージェント: ${validAgents.join(', ')}`);
      process.exit(1);
    }

    const lines = parseInt(options.lines, 10);
    collector.viewLog(agent, lines);
  });

program.parse();