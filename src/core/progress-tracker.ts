import { execSync } from 'child_process';
import chalk from 'chalk';

export type WorkerStatus = 'idle' | 'working';

export interface WorkerState {
  name: string;
  status: WorkerStatus;
  currentTask?: string;
  lastCheck: Date;
}

export interface ProgressSummary {
  timestamp: Date;
  workers: WorkerState[];
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  errors: number;
}

export class ProgressTracker {
  private workerStates: Map<string, WorkerState>;
  private sessionName: string;

  constructor(sessionName: string = 'claudecode-voice') {
    this.sessionName = sessionName;
    this.workerStates = new Map();
    this.initializeStates();
  }

  private initializeStates(): void {
    const workers = ['boss', 'worker1', 'worker2'];
    workers.forEach(worker => {
      this.workerStates.set(worker, {
        name: worker,
        status: 'idle',
        lastCheck: new Date()
      });
    });
  }

  private execCommand(command: string): string {
    try {
      return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      return '';
    }
  }

  private checkWorkerStatus(workerName: string): WorkerStatus {
    const paneId = workerName === 'boss' ? '0.0' : workerName === 'worker1' ? '0.1' : '0.2';
    const lastLine = this.execCommand(`tmux capture-pane -t ${this.sessionName}:${paneId} -p -S -1`);
    
    // シンプルな判定: プロンプト待機中ならidle
    if (lastLine.includes('> ') || lastLine.includes('? for shortcuts')) {
      return 'idle';
    }
    return 'working';
  }

  public updateAllWorkers(): void {
    const workers = ['boss', 'worker1', 'worker2'];
    workers.forEach(worker => {
      const state = this.workerStates.get(worker);
      if (state) {
        state.status = this.checkWorkerStatus(worker);
        state.lastCheck = new Date();
        this.workerStates.set(worker, state);
      }
    });
  }

  public getAllStates(): WorkerState[] {
    return Array.from(this.workerStates.values());
  }

  public getSummary(): ProgressSummary {
    const states = this.getAllStates();
    const workerStatesOnly = states.filter(s => s.name !== 'boss');
    
    return {
      timestamp: new Date(),
      workers: states,
      totalTasks: workerStatesOnly.length,
      activeTasks: workerStatesOnly.filter(s => s.status === 'working').length,
      completedTasks: 0,
      errors: 0
    };
  }

  public displayProgress(): void {
    this.updateAllWorkers();
    const states = this.getAllStates();
    
    console.log(chalk.cyan('\n📊 Worker状態'));
    console.log(chalk.cyan('============='));
    
    states.forEach(worker => {
      const icon = worker.status === 'idle' ? '⚪' : '🔵';
      const status = worker.status === 'idle' ? chalk.gray('idle') : chalk.blue('working');
      console.log(`${icon} ${worker.name}: ${status}`);
    });
  }

}

export default ProgressTracker;