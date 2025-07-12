#!/usr/bin/env node

import chalk from 'chalk';
import { VoiceMessageBus } from '../core/voice-message-bus';
import { execSync } from 'child_process';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startClaudeAgents(): Promise<void> {
  console.log(chalk.blue('\n🚀 Claude Codeを起動します...'));
  
  const agents = [
    { name: 'boss', paneId: '0.0' },
    { name: 'worker1', paneId: '0.1' },
    { name: 'worker2', paneId: '0.2' }
  ];
  
  for (const agent of agents) {
    console.log(chalk.yellow(`  Starting ${agent.name}...`));
    execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" "claude --dangerously-skip-permissions" C-m`);
    await sleep(1000);
  }
  
  console.log(chalk.green('\n✅ 全エージェントの起動が完了しました'));
}

async function startMeeting() {
  const voiceBus = new VoiceMessageBus();
  
  console.log(chalk.cyan('🌅 朝会を開始します...'));
  console.log(chalk.cyan('===================='));
  
  // 1. 朝会モード開始
  voiceBus.startMeetingMode();
  
  // 2. Claude Codeを起動
  await startClaudeAgents();
  
  // 3. 起動完了待機
  console.log(chalk.gray('\n⏱️  エージェントの起動を待機中...'));
  await sleep(5000); // 5秒待機
  
  // 4. 全員に朝会モード開始を通知
  console.log(chalk.blue('\n📢 朝会モード開始を全員に通知...'));
  voiceBus.broadcastMessage('朝会モード開始');
  await sleep(1000);
  
  // 5. Bossに朝会の司会を依頼
  console.log(chalk.green('\n🎯 Bossに朝会の司会を依頼...'));
  voiceBus.sendMessage('boss', '朝会の司会をお願いします。npm runコマンドは使わず、Boss.mdの朝会セクションの手順に従ってください。');
  
  console.log(chalk.yellow('\n⏱️  朝会が進行中です...'));
  console.log(chalk.gray('朝会を終了するには、別のターミナルで以下を実行:'));
  console.log(chalk.gray('npm run meeting:stop'));
}

// メイン処理
async function main() {
  try {
    await startMeeting();
  } catch (error) {
    console.error(chalk.red('❌ エラー:'), error);
    process.exit(1);
  }
}

main();