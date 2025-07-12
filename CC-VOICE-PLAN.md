# CC Voice - 音声会議システム実装計画

## プロジェクト概要

CC Voice（Claude Code Voice）は、完全音声駆動の並列AI開発システムです。複数のAIエージェント（Boss、Worker1、Worker2）が音声で朝会を行い、自律的にタスクを実行します。

## 目指すUX

### 朝会モード
```
You: 朝会

[全員が音声会議室に参加]
Boss (TTS): おはようございます。朝会を始めましょう。
Worker1 (TTS): おはようございます。
Worker2 (TTS): おはようございます。

Boss: 昨日の進捗を報告します...
You: [話し始めると他のエージェントは自動的に黙る]
Worker2: [適切なタイミングで補足]
```

### 通常モード（1対1）
```
You: 新機能について相談したい
Boss: はい、どのような機能でしょうか？
[Bossが裏でWorkerにタスクを振る]
```

## 技術アーキテクチャ

### エージェント構成
- 各エージェントはClaude Code CLI（`claude`コマンド）で起動
- Max Planの範囲内で無制限使用（API課金なし）
- tmuxは使用せず、独立プロセスとして実行

### 音声システム
- TTS: Gemini TTSまたはElevenLabs（sayコマンドは使用しない）
- MCP: 音声機能を持つMCPツールの活用も検討
- VAD + Whisper: ユーザーの音声入力

### 同期メカニズム
- ファイルベースの発言権管理
- 100msごとのポーリング + ファイル監視
- リアルタイムな会話を実現

## ファイル構造

```
claudecode-voice/
├── src/
│   ├── core/
│   │   ├── meeting/          # 会議管理
│   │   ├── voice/            # 音声処理
│   │   ├── agents/           # エージェント基盤
│   │   └── tasks/            # タスク管理
│   ├── scripts/              # 起動スクリプト
│   └── prompts/              # Claude Code用プロンプト
├── shared/                   # エージェント間共有
│   ├── meeting/              # 会議状態
│   ├── tasks/                # タスク情報
│   └── commands/             # コマンドキュー
├── instructions/             # エージェント指示書
├── logs/                     # ログ出力
└── config/                   # 設定ファイル
```

## 実装計画

### Phase 1: 基盤構築（Day 1-2）
1. shared/meeting/ディレクトリ構造作成
2. meeting-manager.ts - 朝会管理
3. speaker-manager.ts - 発言権制御
4. エージェント用プロンプト作成

### Phase 2: エージェント統合（Day 3-4）
1. launch-agents.ts - Claude Code起動
2. meeting-participant.ts - 会議参加機能
3. voice-service.ts - TTS統合
4. instructions更新

### Phase 3: 音声会議実装（Day 5-6）
1. 朝会トリガー実装
2. 会話フロー制御
3. 統合テスト

### Phase 4: 高度な機能（Week 2+）
1. 起床システム
2. YouTube自動投稿
3. 瞑想モード

## 主要な設計判断

1. **Claude Code CLIを使用** - API課金を避け、Max Plan内で完結
2. **tmux不要** - 音声中心のため視覚的分割は不要
3. **ファイルベース同期** - シンプルで確実な発言権管理
4. **TTS/MCP使用** - sayコマンドは使わず、高品質な音声を実現

## 成功指標

- 完全ハンズフリーでの開発管理
- 自然な音声会議体験
- 並列タスク実行の継続
- ローカル完結によるプライバシー保護

## 今後の展望

- Webアプリ版への展開
- より多くのエージェント参加
- 高度な会話制御
- AI開発の新しいパラダイム確立

---

このシステムにより、目を瞑ったまま複数のAIエージェントと音声で協働し、並列開発を進めることが可能になります。