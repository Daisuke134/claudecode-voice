#!/usr/bin/env node

import { VoiceMessageBus } from './src/core/voice-message-bus';

// テスト実行
async function test() {
  console.log('VoiceMessageBus テスト開始...\n');
  
  const voiceBus = new VoiceMessageBus();
  
  // 1. 音声メッセージのテスト
  console.log('1. 音声メッセージテスト');
  voiceBus.sendVoiceMessage('boss', 'これはテストメッセージです', 'test');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. ブロードキャストのテスト
  console.log('\n2. ブロードキャストテスト');
  voiceBus.broadcastVoiceMessage('全員への通知です', 'system');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. 朝会モードのテスト
  console.log('\n3. 朝会モードテスト');
  voiceBus.startMeetingMode();
  console.log('朝会モード状態:', voiceBus.isMeetingActive());
  
  voiceBus.stopMeetingMode();
  console.log('朝会モード終了後:', voiceBus.isMeetingActive());
  
  console.log('\nテスト完了！');
}

test().catch(console.error);