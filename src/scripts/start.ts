#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';

function main() {
  console.log(chalk.cyan('🚀 Claude Code Voice 起動'));
  console.log(chalk.cyan('========================'));
  console.log('');

  try {
    // Check if session exists
    try {
      execSync('tmux has-session -t claudecode-voice 2>/dev/null');
    } catch {
      console.error(chalk.red('❌ セッションが見つかりません'));
      console.log(chalk.yellow('💡 先に npm run setup を実行してください'));
      process.exit(1);
    }

    // Launch Claude Code in all panes
    console.log(chalk.blue('🤖 全エージェントでClaude Codeを起動中...'));
    
    for (let i = 0; i < 3; i++) {
      const command = `tmux send-keys -t claudecode-voice:0.${i} "claude --dangerously-skip-permissions" C-m`;
      execSync(command);
      console.log(chalk.green(`✅ Pane ${i} 起動完了`));
    }

    console.log('');
    console.log(chalk.green('🎉 起動完了！'));
    console.log('');
    console.log(chalk.yellow('💡 次のステップ:'));
    console.log('  1. tmux attach-session -t claudecode-voice でセッションを確認');
    console.log('  2. npm run send boss "タスクを開始してください" でタスクを送信');
  } catch (error) {
    console.error(chalk.red('❌ エラー:'), error);
    process.exit(1);
  }
}

main();