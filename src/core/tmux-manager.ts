import { execSync } from 'child_process';
import chalk from 'chalk';
import * as path from 'path';

export interface AgentConfig {
  name: string;
  type: 'boss' | 'worker';
  color: 'red' | 'blue' | 'green' | 'yellow' | 'magenta';
  title: string;
}

export class TmuxManager {
  private sessionName: string;
  private agents: AgentConfig[];
  private baseDir: string;

  constructor(sessionName: string = 'claudecode-voice') {
    this.sessionName = sessionName;
    this.baseDir = process.cwd();
    this.agents = [
      { name: 'boss', type: 'boss', color: 'red', title: 'Boss Agent' },
      { name: 'worker1', type: 'worker', color: 'blue', title: 'Worker 1' },
      { name: 'worker2', type: 'worker', color: 'green', title: 'Worker 2' },
    ];
  }

  private execCommand(command: string): string {
    try {
      return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      return '';
    }
  }

  private log(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const prefix = {
      info: chalk.blue('[INFO]'),
      success: chalk.green('[SUCCESS]'),
      error: chalk.red('[ERROR]'),
    };
    console.log(`${prefix[type]} ${message}`);
  }

  public async cleanup(): Promise<void> {
    this.log('🧹 既存セッションクリーンアップ開始...');
    
    // Kill existing session if it exists
    this.execCommand(`tmux kill-session -t ${this.sessionName} 2>/dev/null`);
    
    // Clean up tmp files
    this.execCommand('rm -f ./tmp/worker*_done.txt 2>/dev/null');
    this.execCommand('mkdir -p ./tmp');
    
    this.log('✅ クリーンアップ完了', 'success');
  }

  public async createSession(): Promise<void> {
    this.log(`📺 ${this.sessionName}セッション作成開始 (${this.agents.length}エージェント)...`);

    // Create new session with first pane
    this.execCommand(`tmux new-session -d -s ${this.sessionName} -n "agents"`);

    // Create panes for all agents
    if (this.agents.length > 1) {
      // Split horizontally first
      this.execCommand(`tmux split-window -h -t "${this.sessionName}:0"`);
      
      if (this.agents.length > 2) {
        // Split the right pane vertically for third agent
        this.execCommand(`tmux select-pane -t "${this.sessionName}:0.1"`);
        this.execCommand(`tmux split-window -v`);
      }
    }

    // Configure each pane
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      const paneId = `${this.sessionName}:0.${i}`;
      
      // Set pane title
      this.execCommand(`tmux select-pane -t "${paneId}" -T "${agent.title}"`);
      
      // Set working directory
      this.execCommand(`tmux send-keys -t "${paneId}" "cd ${this.baseDir}" C-m`);
      
      // Set colored prompt
      const colorCode = this.getColorCode(agent.color);
      const prompt = `export PS1='(\\[\\033[1;${colorCode}m\\]${agent.name}\\[\\033[0m\\]) \\[\\033[1;32m\\]\\w\\[\\033[0m\\]\\$ '`;
      this.execCommand(`tmux send-keys -t "${paneId}" "${prompt}" C-m`);
      
      // Welcome message
      this.execCommand(`tmux send-keys -t "${paneId}" "echo '=== ${agent.title} ==='" C-m`);
      this.execCommand(`tmux send-keys -t "${paneId}" "echo 'Ready for tasks...'" C-m`);
    }

    // Enable pane borders and titles
    this.execCommand(`tmux set -t ${this.sessionName} pane-border-status top`);
    this.execCommand(`tmux set -t ${this.sessionName} pane-border-format " #{pane_title} "`);

    this.log('✅ セッション作成完了', 'success');
  }

  private getColorCode(color: string): string {
    const colorMap: Record<string, string> = {
      red: '31',
      blue: '34',
      green: '32',
      yellow: '33',
      magenta: '35',
    };
    return colorMap[color] || '37';
  }

  public getSessionInfo(): void {
    console.log('\n📊 セットアップ結果:');
    console.log('===================');
    
    // List tmux sessions
    console.log('\n📺 Tmux Sessions:');
    const sessions = this.execCommand('tmux list-sessions 2>/dev/null');
    if (sessions) {
      console.log(sessions);
    }
    
    console.log('\n📋 エージェント構成:');
    this.agents.forEach((agent, index) => {
      console.log(`  Pane ${index}: ${agent.name} (${agent.title})`);
    });
    
    console.log('\n📋 次のステップ:');
    console.log(`  1. セッションアタッチ: tmux attach-session -t ${this.sessionName}`);
    console.log('  2. Claude Code起動:');
    console.log('     for i in {0..2}; do tmux send-keys -t claudecode-voice:0.$i "claude --dangerously-skip-permissions" C-m; done');
    console.log('  3. エージェントに指示を送信: npm run send <agent> "<message>"');
  }
}

export default TmuxManager;