#!/usr/bin/env node

import { LogCollector } from '../core/log-collector';

const collector = new LogCollector();
collector.tailLogs();