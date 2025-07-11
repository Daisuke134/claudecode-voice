import { execSync, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface LogConfig {
  agentName: string;
  paneId: string;
  sessionName: string;
}

export class LogCollector {
  private logDir: string;
  private sessionName: string;
  private collectors: Map<string, ChildProcess> = new Map();
  private isRunning: boolean = false;

  constructor(sessionName: string = 'claudecode-voice') {
    this.sessionName = sessionName;
    this.logDir = path.join(process.cwd(), 'logs', 'agents');
    this.ensureLogDirs();
  }

  private ensureLogDirs(): void {
    const agents = ['boss', 'worker1', 'worker2'];
    agents.forEach(agent => {
      const agentLogDir = path.join(this.logDir, agent);
      if (!fs.existsSync(agentLogDir)) {
        fs.mkdirSync(agentLogDir, { recursive: true });
      }
    });
  }

  private getLogFileName(agentName: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, agentName, `${dateStr}.log`);
  }

  private execCommand(command: string): string {
    try {
      return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      return '';
    }
  }

  public startCollecting(): void {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️  ログ収集は既に実行中です'));
      return;
    }

    console.log(chalk.blue('🚀 ログ収集を開始します...'));

    const agents: LogConfig[] = [
      { agentName: 'boss', paneId: '0.0', sessionName: this.sessionName },
      { agentName: 'worker1', paneId: '0.1', sessionName: this.sessionName },
      { agentName: 'worker2', paneId: '0.2', sessionName: this.sessionName },
    ];

    agents.forEach(agent => {
      this.startAgentCollector(agent);
    });

    this.isRunning = true;
    console.log(chalk.green('✅ ログ収集が開始されました'));
  }

  private startAgentCollector(config: LogConfig): void {
    const { agentName, paneId, sessionName } = config;
    const logFile = this.getLogFileName(agentName);

    // Initial capture of existing content
    const initialContent = this.execCommand(
      `tmux capture-pane -t ${sessionName}:${paneId} -p`
    );
    
    if (initialContent) {
      const timestamp = new Date().toISOString();
      const header = `\n========== Log Started at ${timestamp} ==========\n`;
      fs.appendFileSync(logFile, header + initialContent + '\n');
    }

    // Start continuous monitoring using a watch approach
    const watchInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(watchInterval);
        return;
      }

      const currentContent = this.execCommand(
        `tmux capture-pane -t ${sessionName}:${paneId} -p -S -30`
      );

      if (currentContent) {
        const lines = currentContent.split('\n').filter(line => line.trim());
        const timestamp = new Date().toISOString();
        
        lines.forEach(line => {
          if (line.trim()) {
            const logEntry = `[${timestamp}] ${line}\n`;
            fs.appendFileSync(logFile, logEntry);
          }
        });
      }
    }, 2000); // Check every 2 seconds

    // Store the interval ID for cleanup
    this.collectors.set(agentName, { kill: () => clearInterval(watchInterval) } as any);
    
    console.log(chalk.blue(`📝 ${agentName} のログ収集を開始: ${logFile}`));
  }

  public stopCollecting(): void {
    if (!this.isRunning) {
      console.log(chalk.yellow('⚠️  ログ収集は実行されていません'));
      return;
    }

    console.log(chalk.blue('🛑 ログ収集を停止中...'));

    this.collectors.forEach((collector, agentName) => {
      if (collector && collector.kill) {
        collector.kill();
      }
      console.log(chalk.blue(`📝 ${agentName} のログ収集を停止`));
    });

    this.collectors.clear();
    this.isRunning = false;

    const timestamp = new Date().toISOString();
    const footer = `\n========== Log Stopped at ${timestamp} ==========\n`;
    
    ['boss', 'worker1', 'worker2'].forEach(agent => {
      const logFile = this.getLogFileName(agent);
      if (fs.existsSync(logFile)) {
        fs.appendFileSync(logFile, footer);
      }
    });

    console.log(chalk.green('✅ ログ収集が停止されました'));
  }

  public getStatus(): void {
    console.log(chalk.cyan('📊 ログ収集ステータス'));
    console.log('===================');
    console.log(`状態: ${this.isRunning ? chalk.green('実行中') : chalk.red('停止中')}`);
    
    if (this.isRunning) {
      console.log(`\n監視中のエージェント:`);
      this.collectors.forEach((_, agentName) => {
        const logFile = this.getLogFileName(agentName);
        const stats = fs.existsSync(logFile) ? fs.statSync(logFile) : null;
        console.log(`  - ${agentName}: ${stats ? `${stats.size} bytes` : 'No log file'}`);
      });
    }

    console.log(`\nログディレクトリ: ${this.logDir}`);
  }

  public viewLog(agentName: string, lines: number = 50): void {
    const logFile = this.getLogFileName(agentName);
    
    if (!fs.existsSync(logFile)) {
      console.log(chalk.red(`❌ ${agentName} のログファイルが見つかりません`));
      return;
    }

    console.log(chalk.cyan(`📄 ${agentName} のログ (最新 ${lines} 行):`));
    console.log('=====================================');

    const content = fs.readFileSync(logFile, 'utf-8');
    const logLines = content.split('\n').filter(line => line.trim());
    const lastLines = logLines.slice(-lines);
    
    lastLines.forEach(line => console.log(line));
  }

  public tailLogs(): void {
    console.log(chalk.cyan('📡 リアルタイムログ監視 (Ctrl+C で終了)'));
    console.log('======================================');

    const agents = ['boss', 'worker1', 'worker2'];
    const lastPositions = new Map<string, number>();

    // Initialize positions
    agents.forEach(agent => {
      const logFile = this.getLogFileName(agent);
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        lastPositions.set(agent, stats.size);
      } else {
        lastPositions.set(agent, 0);
      }
    });

    // Watch for changes
    const interval = setInterval(() => {
      agents.forEach(agent => {
        const logFile = this.getLogFileName(agent);
        if (fs.existsSync(logFile)) {
          const stats = fs.statSync(logFile);
          const lastPos = lastPositions.get(agent) || 0;
          
          if (stats.size > lastPos) {
            const buffer = Buffer.alloc(stats.size - lastPos);
            const fd = fs.openSync(logFile, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, lastPos);
            fs.closeSync(fd);
            
            const newContent = buffer.toString('utf-8');
            const lines = newContent.split('\n').filter(line => line.trim());
            
            lines.forEach(line => {
              console.log(chalk.magenta(`[${agent}]`) + ' ' + line);
            });
            
            lastPositions.set(agent, stats.size);
          }
        }
      });
    }, 1000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(chalk.yellow('\n\n👋 ログ監視を終了しました'));
      process.exit(0);
    });
  }
}

export default LogCollector;