#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exitAgents() {
  console.log(chalk.red('🛑 全エージェントを終了します...'));
  console.log(chalk.red('===================='));
  
  const agents = [
    { name: 'boss', paneId: '0.0' },
    { name: 'worker1', paneId: '0.1' },
    { name: 'worker2', paneId: '0.2' }
  ];
  
  try {
    // 1. 全員にEnterを押して現在の入力をクリア
    console.log(chalk.yellow('1. 入力をクリア...'));
    for (const agent of agents) {
      execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" C-m`);
    }
    await sleep(500);
    
    // 2. 全員にEscapeを押して入力モードから抜ける
    console.log(chalk.yellow('2. 入力モードから抜ける...'));
    for (const agent of agents) {
      execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" Escape`);
    }
    await sleep(500);
    
    // 3. exitコマンドを送信
    console.log(chalk.yellow('3. exitコマンドを送信...'));
    for (const agent of agents) {
      execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" "exit"`);
    }
    await sleep(500);
    
    // 4. Enterを押して実行
    console.log(chalk.yellow('4. 実行...'));
    for (const agent of agents) {
      execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" C-m`);
    }
    
    console.log(chalk.green('\n✅ 全エージェントが終了しました'));
  } catch (error) {
    console.error(chalk.red('❌ エラー:'), error);
  }
}

// メイン処理
async function main() {
  try {
    await exitAgents();
  } catch (error) {
    console.error(chalk.red('❌ エラー:'), error);
    process.exit(1);
  }
}

main();