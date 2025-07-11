#!/usr/bin/env node

import chalk from 'chalk';
import { TmuxManager } from '../core/tmux-manager';

async function main() {
  console.log(chalk.cyan('🤖 Claude Code Voice 環境構築'));
  console.log(chalk.cyan('=============================='));
  console.log('');

  const tmuxManager = new TmuxManager();

  try {
    // Step 1: Cleanup
    await tmuxManager.cleanup();
    console.log('');

    // Step 2: Create session
    await tmuxManager.createSession();
    console.log('');

    // Step 3: Show info
    tmuxManager.getSessionInfo();

    console.log('');
    console.log(chalk.green('🎉 環境セットアップ完了！'));
    console.log('');
    console.log(chalk.yellow('💡 ヒント: 以下のコマンドでセッションにアタッチできます:'));
    console.log(chalk.white('   tmux attach-session -t claudecode-voice'));
  } catch (error) {
    console.error(chalk.red('❌ エラー:'), error);
    process.exit(1);
  }
}

main();