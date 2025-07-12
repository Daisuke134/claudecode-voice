import * as fs from 'fs';
import * as path from 'path';

interface MeetingState {
  active: boolean;
  startTime: string | null;
  mode: 'normal' | 'meeting';
}

interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  status: 'active' | 'idle';
}

interface ParticipantsData {
  participants: Participant[];
  lastUpdated: string | null;
}

export class MeetingManager {
  private sharedDir: string;
  private meetingStateFile: string;
  private participantsFile: string;
  private conversationLogFile: string;

  constructor(sharedDir: string = path.join(process.cwd(), 'shared', 'meeting')) {
    this.sharedDir = sharedDir;
    this.meetingStateFile = path.join(sharedDir, 'meeting-active.json');
    this.participantsFile = path.join(sharedDir, 'participants.json');
    this.conversationLogFile = path.join(sharedDir, 'conversation-log.json');
  }

  /**
   * 朝会を開始
   */
  async startMeeting(): Promise<void> {
    console.log('🎤 朝会を開始します...');

    // 朝会状態を更新
    const meetingState: MeetingState = {
      active: true,
      startTime: new Date().toISOString(),
      mode: 'meeting'
    };
    this.writeJson(this.meetingStateFile, meetingState);

    // 参加者リストを初期化
    const participantsData: ParticipantsData = {
      participants: [],
      lastUpdated: new Date().toISOString()
    };
    this.writeJson(this.participantsFile, participantsData);

    // 会話ログを初期化
    const conversationLog = {
      messages: [],
      meetingId: `meeting-${Date.now()}`
    };
    this.writeJson(this.conversationLogFile, conversationLog);

    console.log('✅ 朝会モードが有効になりました');
  }

  /**
   * 朝会を終了
   */
  async endMeeting(): Promise<void> {
    console.log('🔚 朝会を終了します...');

    // 現在の朝会ログを保存
    await this.saveMeetingLog();

    // 朝会状態をリセット
    const meetingState: MeetingState = {
      active: false,
      startTime: null,
      mode: 'normal'
    };
    this.writeJson(this.meetingStateFile, meetingState);

    // 参加者リストをクリア
    const participantsData: ParticipantsData = {
      participants: [],
      lastUpdated: null
    };
    this.writeJson(this.participantsFile, participantsData);

    console.log('✅ 朝会モードが終了しました');
  }

  /**
   * 参加者を追加
   */
  async joinMeeting(participantId: string, participantName: string): Promise<void> {
    const participantsData = this.readJson<ParticipantsData>(this.participantsFile);
    
    // 既に参加していないかチェック
    const existingIndex = participantsData.participants.findIndex(p => p.id === participantId);
    if (existingIndex === -1) {
      const participant: Participant = {
        id: participantId,
        name: participantName,
        joinedAt: new Date().toISOString(),
        status: 'active'
      };
      participantsData.participants.push(participant);
      participantsData.lastUpdated = new Date().toISOString();
      
      this.writeJson(this.participantsFile, participantsData);
      console.log(`👤 ${participantName}が朝会に参加しました`);
    }
  }

  /**
   * 参加者を退出
   */
  async leaveMeeting(participantId: string): Promise<void> {
    const participantsData = this.readJson<ParticipantsData>(this.participantsFile);
    
    participantsData.participants = participantsData.participants.filter(p => p.id !== participantId);
    participantsData.lastUpdated = new Date().toISOString();
    
    this.writeJson(this.participantsFile, participantsData);
    console.log(`👤 参加者${participantId}が退出しました`);
  }

  /**
   * 朝会が有効かチェック
   */
  isMeetingActive(): boolean {
    try {
      const state = this.readJson<MeetingState>(this.meetingStateFile);
      return state.active;
    } catch {
      return false;
    }
  }

  /**
   * 現在の参加者リストを取得
   */
  getParticipants(): Participant[] {
    try {
      const data = this.readJson<ParticipantsData>(this.participantsFile);
      return data.participants;
    } catch {
      return [];
    }
  }

  /**
   * 会話をログに記録
   */
  logConversation(speaker: string, message: string): void {
    try {
      const log = this.readJson<any>(this.conversationLogFile);
      log.messages.push({
        speaker,
        message,
        timestamp: new Date().toISOString()
      });
      this.writeJson(this.conversationLogFile, log);
    } catch (error) {
      console.error('会話ログの記録に失敗:', error);
    }
  }

  /**
   * 朝会ログを日付別に保存
   */
  private async saveMeetingLog(): Promise<void> {
    try {
      const log = this.readJson<any>(this.conversationLogFile);
      if (log.messages.length > 0) {
        const date = new Date().toISOString().split('T')[0];
        const dailyLogFile = path.join(this.sharedDir, 'daily', `${date}.json`);
        
        // 既存のログがあれば追加、なければ新規作成
        let dailyLog = { meetings: [] };
        if (fs.existsSync(dailyLogFile)) {
          dailyLog = this.readJson<any>(dailyLogFile);
        }
        
        dailyLog.meetings.push({
          meetingId: log.meetingId,
          startTime: this.readJson<MeetingState>(this.meetingStateFile).startTime,
          endTime: new Date().toISOString(),
          messages: log.messages
        });
        
        this.writeJson(dailyLogFile, dailyLog);
        console.log(`📝 朝会ログを保存しました: ${dailyLogFile}`);
      }
    } catch (error) {
      console.error('朝会ログの保存に失敗:', error);
    }
  }

  /**
   * JSONファイルを読み込み
   */
  private readJson<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * JSONファイルに書き込み
   */
  private writeJson(filePath: string, data: any): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

export default MeetingManager;