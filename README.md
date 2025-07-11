# Claude Code Voice

完全音声対話による並列AI開発システム。目を瞑っていても、寝ている間も開発が進む。

## 🎯 概要

Claude Code Voiceは、複数のAIエージェントが協調して並列開発を行うシステムです。音声対話で指示を出すだけで、自動的にタスクを分解し、並列実行します。

## 🚀 特徴

- **並列開発**: Boss + Workers構成で効率的なタスク実行
- **自動ログ監視**: エラーを自動検出してBossに報告
- **Git Worktree統合**: 各Workerが独立した環境で作業（コンフリクトゼロ）
- **音声対話対応**: 将来的に完全音声操作を実現

## 📦 インストール

```bash
npm install
npm run build
```

## 🎮 使い方

```bash
# セットアップ
npm run setup

# 実行
npm run start
```

## 🏗️ アーキテクチャ

```
Boss Agent
├── Worker 1 (UI開発)
├── Worker 2 (API開発)
└── Worker 3 (テスト/インフラ)
```

## 📝 ライセンス

MIT License

---

"生きとし生けるものが幸せでありますように"