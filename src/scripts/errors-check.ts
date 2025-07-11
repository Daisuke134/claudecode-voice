#!/usr/bin/env node

import { ErrorDetector } from '../core/error-detector';

const detector = new ErrorDetector();
const summaries = detector.checkAllAgents();

// Display report
detector.displayErrorReport(summaries);

// Save to error log
detector.saveErrorReport(summaries);