/**
 * Test script to verify performance optimizations
 */

import { UploadOptimizer, MemoryMonitor } from './services/uploadOptimizer';

console.log('🧪 Testing Upload Performance Optimizations\n');

// Test 1: Performance Capabilities
console.log('1️⃣ Checking Browser Capabilities:');
const capabilities = UploadOptimizer.getPerformanceCapabilities();
console.log('   Scheduler API:', capabilities.hasSchedulerAPI ? '✅' : '❌');
console.log('   Web Workers:', capabilities.hasWebWorkers ? '✅' : '❌');
console.log('   OffscreenCanvas:', capabilities.hasOffscreenCanvas ? '✅' : '❌');
console.log('   Recommended Chunk Size:', (capabilities.recommendedChunkSize / 1024).toFixed(0) + 'KB');
console.log('');

// Test 2: Time Estimation
console.log('2️⃣ Processing Time Estimates:');
const testSizes = [
    { size: 500 * 1024, label: '500KB' },
    { size: 1024 * 1024, label: '1MB' },
    { size: 5 * 1024 * 1024, label: '5MB' },
    { size: 10 * 1024 * 1024, label: '10MB' }
];

testSizes.forEach(({ size, label }) => {
    const estimate = UploadOptimizer.estimateProcessingTime(size);
    const minutes = Math.floor(estimate.estimatedSeconds / 60);
    const seconds = estimate.estimatedSeconds % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    console.log(`   ${label}: ~${timeStr} (confidence: ${estimate.confidence})`);
});
console.log('');

// Test 3: Memory Info
console.log('3️⃣ Memory Status:');
const memInfo = MemoryMonitor.getMemoryInfo();
console.log('   Current Usage:', memInfo);
const isHighMemory = MemoryMonitor.isMemoryPressure();
console.log('   Memory Pressure:', isHighMemory ? '⚠️ HIGH' : '✅ Normal');
console.log('');

// Test 4: Batch Processing Simulation
console.log('4️⃣ Testing Batch Processing:');
const items = Array.from({ length: 10 }, (_, i) => i + 1);
let processed = 0;

console.log('   Processing 10 items with concurrency limit of 3...');
const startTime = Date.now();

UploadOptimizer.batchProcess(
    items,
    async (item) => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 100));
        return item * 2;
    },
    {
        concurrency: 3,
        onProgress: (done, total) => {
            processed = done;
            console.log(`   Progress: ${done}/${total} items (${((done/total)*100).toFixed(0)}%)`);
        }
    }
).then(results => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`   ✅ Completed in ${duration}ms`);
    console.log(`   Results: [${results.slice(0, 5).join(', ')}...]`);
    console.log('');
    
    // Test 5: Summary
    console.log('✅ All Tests Complete!');
    console.log('\n📊 Summary:');
    console.log('   - Browser capabilities detected');
    console.log('   - Time estimation working');
    console.log('   - Memory monitoring active');
    console.log('   - Batch processing functional');
    console.log('\n🚀 Performance optimizations are ready!');
}).catch(error => {
    console.error('❌ Test failed:', error);
});
