import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface ErrorInfo {
  agentName: string;
  timestamp: string;
  message: string;
  type: string; // error, failed, exception, etc.
  lineNumber?: number;
}

export interface ErrorSummary {
  agentName: string;
  errorCount: number;
  errors: ErrorInfo[];
}

export class ErrorDetector {
  private logDir: string;
  private errorDir: string;
  private errorPatterns: RegExp[] = [
    /error:/i,
    /failed/i,
    /exception/i,
    /TypeError/,
    /ReferenceError/,
    /SyntaxError/,
    /❌/,
    /失敗/,
    /エラー/
  ];

  constructor(logDir: string = path.join(process.cwd(), 'logs')) {
    this.logDir = logDir;
    this.errorDir = path.join(logDir, 'errors');
    this.ensureErrorDir();
  }

  private ensureErrorDir(): void {
    if (!fs.existsSync(this.errorDir)) {
      fs.mkdirSync(this.errorDir, { recursive: true });
    }
  }

  private getLogFileName(agentName: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return path.join(this.logDir, 'agents', agentName, `${dateStr}.log`);
  }

  private getErrorLogFileName(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return path.join(this.errorDir, `${dateStr}.log`);
  }

  public detectErrorsInLog(agentName: string): ErrorInfo[] {
    const logFile = this.getLogFileName(agentName);
    if (!fs.existsSync(logFile)) {
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n');
    const errors: ErrorInfo[] = [];

    lines.forEach((line, index) => {
      const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

      for (const pattern of this.errorPatterns) {
        if (pattern.test(line)) {
          const errorType = this.determineErrorType(line);
          errors.push({
            agentName,
            timestamp,
            message: line.replace(/^\[.*?\]\s*/, '').trim(),
            type: errorType,
            lineNumber: index + 1
          });
          break;
        }
      }
    });

    return errors;
  }

  private determineErrorType(line: string): string {
    if (/TypeError/.test(line)) return 'TypeError';
    if (/ReferenceError/.test(line)) return 'ReferenceError';
    if (/SyntaxError/.test(line)) return 'SyntaxError';
    if (/failed/i.test(line)) return 'Failed';
    if (/exception/i.test(line)) return 'Exception';
    if (/error:/i.test(line)) return 'Error';
    if (/❌/.test(line)) return 'Error';
    if (/失敗|エラー/.test(line)) return 'Error';
    return 'Unknown';
  }

  public checkAllAgents(): ErrorSummary[] {
    const agents = ['boss', 'worker1', 'worker2'];
    const summaries: ErrorSummary[] = [];

    agents.forEach(agent => {
      const errors = this.detectErrorsInLog(agent);
      summaries.push({
        agentName: agent,
        errorCount: errors.length,
        errors
      });
    });

    return summaries;
  }

  public saveErrorReport(summaries: ErrorSummary[]): void {
    const errorLogFile = this.getErrorLogFileName();
    const timestamp = new Date().toISOString();
    let report = `\n========== Error Report at ${timestamp} ==========\n`;

    summaries.forEach(summary => {
      if (summary.errorCount > 0) {
        report += `\n${summary.agentName}: ${summary.errorCount} error(s)\n`;
        summary.errors.forEach(error => {
          report += `  - [${error.timestamp}] ${error.type}: ${error.message}\n`;
        });
      }
    });

    if (summaries.every(s => s.errorCount === 0)) {
      report += '\nNo errors detected in any agent.\n';
    }

    report += '================================================\n';
    fs.appendFileSync(errorLogFile, report);
  }

  public displayErrorReport(summaries: ErrorSummary[]): void {
    console.log(chalk.red('\n🚨 エラー検出レポート'));
    console.log(chalk.red('=================='));

    let totalErrors = 0;
    summaries.forEach(summary => {
      totalErrors += summary.errorCount;
      
      if (summary.errorCount > 0) {
        console.log(chalk.yellow(`\n${summary.agentName}: ${summary.errorCount}件のエラー`));
        summary.errors.forEach(error => {
          const time = new Date(error.timestamp).toLocaleTimeString('ja-JP');
          console.log(chalk.red(`  - [${time}] ${error.type}: ${error.message}`));
        });
      } else {
        console.log(chalk.green(`\n${summary.agentName}: エラーなし`));
      }
    });

    if (totalErrors === 0) {
      console.log(chalk.green('\n✅ すべてのエージェントでエラーは検出されませんでした'));
    } else {
      console.log(chalk.red(`\n合計: ${totalErrors}件のエラーが検出されました`));
    }
  }

  public watchForErrors(callback?: (error: ErrorInfo) => void): void {
    console.log(chalk.blue('👁️  リアルタイムエラー監視を開始します...'));
    console.log(chalk.yellow('Ctrl+C で終了'));

    const agents = ['boss', 'worker1', 'worker2'];
    const lastChecked = new Map<string, number>();

    // Initialize last checked positions
    agents.forEach(agent => {
      const logFile = this.getLogFileName(agent);
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        lastChecked.set(agent, stats.size);
      } else {
        lastChecked.set(agent, 0);
      }
    });

    const interval = setInterval(() => {
      agents.forEach(agent => {
        const logFile = this.getLogFileName(agent);
        if (fs.existsSync(logFile)) {
          const stats = fs.statSync(logFile);
          const lastPos = lastChecked.get(agent) || 0;

          if (stats.size > lastPos) {
            const buffer = Buffer.alloc(stats.size - lastPos);
            const fd = fs.openSync(logFile, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, lastPos);
            fs.closeSync(fd);

            const newContent = buffer.toString('utf-8');
            const lines = newContent.split('\n').filter(line => line.trim());

            lines.forEach(line => {
              for (const pattern of this.errorPatterns) {
                if (pattern.test(line)) {
                  const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
                  const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
                  const errorType = this.determineErrorType(line);
                  
                  const errorInfo: ErrorInfo = {
                    agentName: agent,
                    timestamp,
                    message: line.replace(/^\[.*?\]\s*/, '').trim(),
                    type: errorType
                  };

                  // Display error
                  const time = new Date(timestamp).toLocaleTimeString('ja-JP');
                  console.log(chalk.red(`\n🚨 [${time}] ${agent} - ${errorType}: ${errorInfo.message}`));

                  // Call callback if provided
                  if (callback) {
                    callback(errorInfo);
                  }

                  // Save to error log
                  this.saveErrorReport([{
                    agentName: agent,
                    errorCount: 1,
                    errors: [errorInfo]
                  }]);

                  break;
                }
              }
            });

            lastChecked.set(agent, stats.size);
          }
        }
      });
    }, 1000); // Check every second

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(chalk.yellow('\n\n👋 エラー監視を終了しました'));
      process.exit(0);
    });
  }
}

export default ErrorDetector;