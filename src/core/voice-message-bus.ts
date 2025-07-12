import { MessageBus } from './message-bus';
import { execSync } from 'child_process';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export class VoiceMessageBus extends MessageBus {
  private speakingFile: string;
  
  constructor(sessionName: string = 'claudecode-voice') {
    super(sessionName);
    this.speakingFile = path.join(process.cwd(), 'tmp', 'speaking.txt');
    this.ensureTmpDir();
  }

  private ensureTmpDir(): void {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  }

  private setSpeaking(agent: string): void {
    fs.writeFileSync(this.speakingFile, agent);
  }

  private clearSpeaking(): void {
    if (fs.existsSync(this.speakingFile)) {
      fs.unlinkSync(this.speakingFile);
    }
  }

  private isSomeoneSpeaking(): boolean {
    return fs.existsSync(this.speakingFile);
  }

  private waitForTurn(maxWaitMs: number = 30000): void {
    const startTime = Date.now();
    while (this.isSomeoneSpeaking()) {
      if (Date.now() - startTime > maxWaitMs) {
        console.log(chalk.yellow('⚠️  発言待機タイムアウト'));
        break;
      }
      execSync('sleep 0.5');
    }
  }

  public sendVoiceMessage(to: string, content: string, from?: string): void {
    // 発言権を待つ
    this.waitForTurn();
    
    // 発言権を取得
    this.setSpeaking(from || to);
    
    console.log(chalk.blue(`🎤 音声発言中: ${from || 'system'} → ${to}`));
    
    try {
      // sayコマンドで音声出力
      const sayCommand = `say "${content}"`;
      execSync(sayCommand);
      
      // 通常のメッセージ送信
      this.sendMessage(to, content, from);
      
    } finally {
      // 発言権を解放
      this.clearSpeaking();
    }
  }

  public broadcastVoiceMessage(content: string, from: string = 'system'): void {
    const agents = ['boss', 'worker1', 'worker2'];
    
    // 発言権を待つ
    this.waitForTurn();
    
    // 発言権を取得
    this.setSpeaking(from);
    
    console.log(chalk.magenta(`📢 全体音声アナウンス: ${from}`));
    
    try {
      // sayコマンドで音声出力
      const sayCommand = `say "${content}"`;
      execSync(sayCommand);
      
      // 全員にメッセージ送信
      agents.forEach(agent => {
        this.sendMessage(agent, content, from);
      });
      
    } finally {
      // 発言権を解放
      this.clearSpeaking();
    }
  }

  public startMeetingMode(): void {
    const meetingFlag = path.join(process.cwd(), 'tmp', 'meeting-active.txt');
    fs.writeFileSync(meetingFlag, 'true');
    console.log(chalk.green('✅ 朝会モード開始'));
  }

  public stopMeetingMode(): void {
    const meetingFlag = path.join(process.cwd(), 'tmp', 'meeting-active.txt');
    if (fs.existsSync(meetingFlag)) {
      fs.unlinkSync(meetingFlag);
    }
    this.clearSpeaking();
    console.log(chalk.red('🛑 朝会モード終了'));
  }

  public isMeetingActive(): boolean {
    const meetingFlag = path.join(process.cwd(), 'tmp', 'meeting-active.txt');
    return fs.existsSync(meetingFlag);
  }
}

export default VoiceMessageBus;