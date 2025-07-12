#!/usr/bin/env node

import chalk from 'chalk';
import { VoiceMessageBus } from '../core/voice-message-bus';

async function stopMeeting() {
  const voiceBus = new VoiceMessageBus();
  
  console.log(chalk.red('🛑 朝会を終了します...'));
  console.log(chalk.red('===================='));
  
  // 1. 全エージェントに朝会終了を通知
  console.log(chalk.blue('\n📢 全エージェントに朝会終了を通知...'));
  const agents = ['boss', 'worker1', 'worker2'];
  
  for (const agent of agents) {
    voiceBus.sendMessage(agent, "朝会モードを終了します。通常の作業モードに戻ってください。");
  }
  
  // 2. 朝会モード終了
  voiceBus.stopMeetingMode();
  
  console.log(chalk.green('\n✅ 朝会が終了しました'));
  console.log(chalk.gray('各エージェントは通常の作業を続行できます。'));
}

// メイン処理
async function main() {
  try {
    await stopMeeting();
  } catch (error) {
    console.error(chalk.red('❌ エラー:'), error);
    process.exit(1);
  }
}

main();