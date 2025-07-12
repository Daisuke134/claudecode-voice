#!/usr/bin/env node

import chalk from 'chalk';
import { VoiceMessageBus } from '../core/voice-message-bus';
import { execSync } from 'child_process';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startMeeting() {
  const voiceBus = new VoiceMessageBus();
  
  console.log(chalk.cyan('🌅 朝会を開始します...'));
  console.log(chalk.cyan('===================='));
  
  // 1. 朝会モード開始
  voiceBus.startMeetingMode();
  
  // 2. 全エージェントに朝会モード通知
  console.log(chalk.blue('\n📢 全エージェントに朝会モードを通知...'));
  const agents = ['boss', 'worker1', 'worker2'];
  
  for (const agent of agents) {
    voiceBus.sendMessage(agent, 
      "朝会モードに入ります。すべての発言はsayコマンドで音声化してください。他の人が話している間は待機してください。");
    await sleep(500);
  }
  
  await sleep(2000);
  
  // 3. Bossに朝会開始を指示
  console.log(chalk.green('\n🎯 Bossに朝会進行を依頼...'));
  voiceBus.sendMessage('boss', `朝会を開始してください。以下の順序で進行してください：

1. 挨拶と朝会開始の宣言（sayコマンドで音声出力）
2. プロジェクト全体の進捗概要を報告（sayコマンドで音声出力）
3. Worker1に進捗を確認（sayコマンドで音声出力）
4. Worker1の報告を待つ
5. Worker2に進捗を確認（sayコマンドで音声出力）
6. Worker2の報告を待つ
7. 本日のタスクを説明（sayコマンドで音声出力）
8. 締めの言葉（sayコマンドで音声出力）

重要：すべての発言を必ずsayコマンドで音声化してください。
例: say "おはようございます。朝会を始めましょう"`);
  
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