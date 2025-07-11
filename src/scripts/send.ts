#!/usr/bin/env node

import chalk from 'chalk';
import { MessageBus } from '../core/message-bus';
import { Command } from 'commander';

const program = new Command();

program
  .name('send')
  .description('Send message to agents')
  .version('0.1.0')
  .argument('[agent]', 'Target agent (boss, worker1, worker2)')
  .argument('[message]', 'Message to send')
  .option('-l, --list', 'List available agents')
  .action((agent, message, options) => {
    const messageBus = new MessageBus();

    try {
      if (options.list) {
        messageBus.listAgents();
        return;
      }

      if (!agent || !message) {
        console.error(chalk.red('❌ エラー: エージェント名とメッセージが必要です'));
        console.log('');
        console.log('使用方法:');
        console.log('  npm run send <agent> "<message>"');
        console.log('  npm run send -- --list');
        console.log('');
        console.log('例:');
        console.log('  npm run send boss "Hello Worldタスクを開始してください"');
        console.log('  npm run send worker1 "タスクを実行してください"');
        process.exit(1);
      }

      messageBus.sendMessage(agent, message, 'user');
    } catch (error) {
      console.error(chalk.red('❌ エラー:'), error);
      process.exit(1);
    }
  });

program.parse();