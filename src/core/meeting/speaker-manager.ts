import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

interface SpeakerState {
  speaker: string | null;
  timestamp: number | null;
}

export class SpeakerManager extends EventEmitter {
  private speakerFile: string;
  private checkInterval: number = 100; // 100ms
  private maxSpeakingTime: number = 30000; // 30秒
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(sharedDir: string = path.join(process.cwd(), 'shared', 'meeting')) {
    super();
    this.speakerFile = path.join(sharedDir, 'current-speaker.json');
    this.ensureFileExists();
  }

  /**
   * ファイルが存在することを確認
   */
  private ensureFileExists(): void {
    if (!fs.existsSync(this.speakerFile)) {
      this.clearSpeaker();
    }
  }

  /**
   * 発言権を取得
   */
  async acquireSpeakingRight(speakerId: string): Promise<boolean> {
    const maxAttempts = 50; // 5秒間試行
    let attempts = 0;

    while (attempts < maxAttempts) {
      const currentSpeaker = this.getCurrentSpeaker();

      // 誰も話していない、または自分が話者の場合
      if (!currentSpeaker.speaker || currentSpeaker.speaker === speakerId) {
        // 発言者として登録
        this.setSpeaker(speakerId);
        console.log(`🎤 ${speakerId}が発言を開始`);
        return true;
      }

      // タイムアウトチェック（30秒以上話している場合は強制解放）
      if (currentSpeaker.timestamp && 
          Date.now() - currentSpeaker.timestamp > this.maxSpeakingTime) {
        console.log(`⏱️ ${currentSpeaker.speaker}の発言時間超過、発言権を解放`);
        this.clearSpeaker();
        continue;
      }

      // 他の人が話している場合は待機
      await this.sleep(this.checkInterval);
      attempts++;
    }

    console.log(`❌ ${speakerId}は発言権を取得できませんでした`);
    return false;
  }

  /**
   * 発言権を解放
   */
  releaseSpeakingRight(speakerId: string): void {
    const currentSpeaker = this.getCurrentSpeaker();
    
    // 自分が発言者の場合のみ解放
    if (currentSpeaker.speaker === speakerId) {
      this.clearSpeaker();
      console.log(`🔚 ${speakerId}が発言を終了`);
      this.emit('speakerChanged', null);
    }
  }

  /**
   * 現在の発言者を取得
   */
  getCurrentSpeaker(): SpeakerState {
    try {
      const content = fs.readFileSync(this.speakerFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { speaker: null, timestamp: null };
    }
  }

  /**
   * 発言者を設定
   */
  private setSpeaker(speakerId: string): void {
    const state: SpeakerState = {
      speaker: speakerId,
      timestamp: Date.now()
    };
    fs.writeFileSync(this.speakerFile, JSON.stringify(state, null, 2));
    this.emit('speakerChanged', speakerId);
  }

  /**
   * 発言者をクリア
   */
  private clearSpeaker(): void {
    const state: SpeakerState = {
      speaker: null,
      timestamp: null
    };
    fs.writeFileSync(this.speakerFile, JSON.stringify(state, null, 2));
  }

  /**
   * 発言者の監視を開始
   */
  startWatching(): void {
    if (this.watchInterval) return;

    this.watchInterval = setInterval(() => {
      const currentSpeaker = this.getCurrentSpeaker();
      
      // タイムアウトチェック
      if (currentSpeaker.speaker && currentSpeaker.timestamp &&
          Date.now() - currentSpeaker.timestamp > this.maxSpeakingTime) {
        console.log(`⏱️ ${currentSpeaker.speaker}の発言時間超過、自動解放`);
        this.clearSpeaker();
        this.emit('speakerTimeout', currentSpeaker.speaker);
      }
    }, 1000); // 1秒ごとにチェック

    // ファイル監視も追加
    fs.watchFile(this.speakerFile, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        const speaker = this.getCurrentSpeaker();
        this.emit('speakerChanged', speaker.speaker);
      }
    });
  }

  /**
   * 発言者の監視を停止
   */
  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    fs.unwatchFile(this.speakerFile);
  }

  /**
   * 他の人が話している間待つ
   */
  async waitForTurn(speakerId: string, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const currentSpeaker = this.getCurrentSpeaker();
      
      // 誰も話していない、または自分の番
      if (!currentSpeaker.speaker || currentSpeaker.speaker === speakerId) {
        return true;
      }

      await this.sleep(this.checkInterval);
    }

    return false;
  }

  /**
   * 誰かが話しているかチェック
   */
  isSomeoneSpeaking(): boolean {
    const currentSpeaker = this.getCurrentSpeaker();
    return currentSpeaker.speaker !== null;
  }

  /**
   * 特定の人が話しているかチェック
   */
  isSpeaking(speakerId: string): boolean {
    const currentSpeaker = this.getCurrentSpeaker();
    return currentSpeaker.speaker === speakerId;
  }

  /**
   * スリープ関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.stopWatching();
    this.clearSpeaker();
    this.removeAllListeners();
  }
}

export default SpeakerManager;