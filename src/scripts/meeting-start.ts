#!/usr/bin/env node

import chalk from 'chalk';
import { VoiceMessageBus } from '../core/voice-message-bus';
import { execSync } from 'child_process';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface AgentConfig {
  name: string;
  paneId: string;
}

async function restartAgent(agent: AgentConfig): Promise<void> {
  console.log(chalk.yellow(`🔄 ${agent.name}を再起動中...`));
  
  try {
    // 1. 既存のpaneをkill
    execSync(`tmux kill-pane -t "claudecode-voice:${agent.paneId}" 2>/dev/null`, { stdio: 'ignore' });
    await sleep(500);
    
    // 2. pane構成を再作成
    if (agent.paneId === '0.0') {
      // Bossの場合: 新しいwindowの最初のpane
      execSync(`tmux new-window -t claudecode-voice:0 -n agents 2>/dev/null || true`);
    } else if (agent.paneId === '0.1') {
      // Worker1の場合: 水平分割
      execSync(`tmux split-window -h -t "claudecode-voice:0"`);
    } else if (agent.paneId === '0.2') {
      // Worker2の場合: Worker1のpaneを垂直分割
      execSync(`tmux select-pane -t "claudecode-voice:0.1"`);
      execSync(`tmux split-window -v`);
    }
    
    // 3. ディレクトリ移動
    execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" "cd ${process.cwd()}" C-m`);
    await sleep(500);
    
    // 4. Claude Code起動
    execSync(`tmux send-keys -t "claudecode-voice:${agent.paneId}" "claude --dangerously-skip-permissions" C-m`);
    
    console.log(chalk.green(`✅ ${agent.name}再起動完了`));
  } catch (error) {
    console.error(chalk.red(`❌ ${agent.name}の再起動に失敗:`, error));
  }
}

async function restartAllAgents(): Promise<void> {
  console.log(chalk.blue('\n🔄 全エージェントを再起動します...'));
  
  const agents: AgentConfig[] = [
    { name: 'boss', paneId: '0.0' },
    { name: 'worker1', paneId: '0.1' },
    { name: 'worker2', paneId: '0.2' }
  ];
  
  // 全paneを一旦kill
  for (const agent of agents.reverse()) {
    try {
      execSync(`tmux kill-pane -t "claudecode-voice:${agent.paneId}" 2>/dev/null`, { stdio: 'ignore' });
    } catch {}
  }
  
  await sleep(1000);
  
  // 順番に再起動
  for (const agent of agents) {
    await restartAgent(agent);
    await sleep(3000); // 起動待機
  }
  
  console.log(chalk.green('\n✅ 全エージェントの再起動が完了しました'));
}

async function startMeeting() {
  const voiceBus = new VoiceMessageBus();
  
  console.log(chalk.cyan('🌅 朝会を開始します...'));
  console.log(chalk.cyan('===================='));
  
  // 1. 朝会モード開始
  voiceBus.startMeetingMode();
  
  // 2. エージェントを再起動（新しいmdファイルを読み込ませる）
  await restartAllAgents();
  
  // 3. 起動完了待機
  console.log(chalk.gray('\n⏱️  エージェントの起動を待機中...'));
  await sleep(10000); // 10秒待機
  
  // 4. 全エージェントに朝会モード通知
  console.log(chalk.blue('\n📢 全エージェントに朝会モードを通知...'));
  const agents = ['boss', 'worker1', 'worker2'];
  
  for (const agent of agents) {
    voiceBus.sendMessage(agent, 
      `朝会モードに入ります。
【重要】すべての発言は必ずsayコマンドで音声化してください。
例: say "おはようございます"
他の人が話している間は待機してください。`);
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