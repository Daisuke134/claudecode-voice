import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface Message {
  from?: string;
  to: string;
  content: string;
  timestamp: Date;
}

export class MessageBus {
  private sessionName: string;
  private logDir: string;

  constructor(sessionName: string = 'claudecode-voice') {
    this.sessionName = sessionName;
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getAgentTarget(agentName: string): string {
    const targetMap: Record<string, string> = {
      boss: `${this.sessionName}:0.0`,
      worker1: `${this.sessionName}:0.1`,
      worker2: `${this.sessionName}:0.2`,
    };
    return targetMap[agentName] || '';
  }

  private execCommand(command: string): void {
    try {
      execSync(command, { encoding: 'utf-8' });
    } catch (error) {
      throw new Error(`Command failed: ${command}`);
    }
  }

  private logMessage(message: Message): void {
    const logFile = path.join(this.logDir, 'messages.log');
    const logEntry = `[${message.timestamp.toISOString()}] ${message.from || 'system'} → ${message.to}: "${message.content}"\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }

  public sendMessage(to: string, content: string, from?: string): void {
    const target = this.getAgentTarget(to);
    
    if (!target) {
      throw new Error(`Unknown agent: ${to}`);
    }

    // Check if target session exists
    try {
      this.execCommand(`tmux has-session -t ${this.sessionName} 2>/dev/null`);
    } catch {
      throw new Error(`Session '${this.sessionName}' not found. Run 'npm run setup' first.`);
    }

    console.log(chalk.blue(`📤 送信中: ${to} ← '${content}'`));

    // Clear current prompt
    this.execCommand(`tmux send-keys -t "${target}" C-c`);
    // Wait a bit
    this.execCommand('sleep 0.3');
    
    // Send message
    this.execCommand(`tmux send-keys -t "${target}" "${content}"`);
    this.execCommand('sleep 0.1');
    
    // Press enter
    this.execCommand(`tmux send-keys -t "${target}" C-m`);
    this.execCommand('sleep 0.5');

    // Log the message
    const message: Message = {
      from,
      to,
      content,
      timestamp: new Date(),
    };
    this.logMessage(message);

    console.log(chalk.green(`✅ 送信完了: ${to} に '${content}'`));
  }

  public listAgents(): void {
    console.log(chalk.cyan('📋 利用可能なエージェント:'));
    console.log('==========================');
    console.log('  boss     → claudecode-voice:0.0  (タスク管理者)');
    console.log('  worker1  → claudecode-voice:0.1  (実行担当者A)');
    console.log('  worker2  → claudecode-voice:0.2  (実行担当者B)');
  }
}

export default MessageBus;