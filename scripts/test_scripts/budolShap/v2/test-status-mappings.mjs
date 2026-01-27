// test-status-mappings.mjs
console.log('Test script starting');
// Script to test status mappings for Ship24 and TrackingMore

import { SHIPPING_PROVIDERS, PROVIDER_TIMELINE_EVENTS, TRACKING_REMARKS } from '../lib/shipping/config.js';

// Mock generateTimeline function based on TrackingTimeline logic
function generateTimeline(order) {
    const events = [];
    const shippingStatus = order.shipping?.status || order.shipping?.lastEvent;
    
    // Add Placed
    events.push({ title: 'Placed', status: 'completed' });

    // Add Paid
    events.push({ title: 'Paid', status: order.isPaid ? 'completed' : 'pending' });

    // Provider specific
    const provider = order.shipping?.provider || SHIPPING_PROVIDERS.STANDARD;
    const timelineConfig = PROVIDER_TIMELINE_EVENTS[provider] || PROVIDER_TIMELINE_EVENTS[SHIPPING_PROVIDERS.STANDARD];

    // Processing
    if (['PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)) {
        events.push({ title: timelineConfig.PROCESSING.title, status: 'completed' });
    }

    // Shipped
    if (['SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)) {
        events.push({ title: timelineConfig.SHIPPED.title, status: order.status === 'SHIPPED' ? 'current' : 'completed' });
    }

    // In Transit
    if (['IN_TRANSIT', 'DELIVERED'].includes(order.status) || timelineConfig.IN_TRANSIT.triggerStatuses?.includes(shippingStatus)) {
        let description = timelineConfig.IN_TRANSIT.description;
        if (TRACKING_REMARKS[provider]?.[shippingStatus]) {
            description = TRACKING_REMARKS[provider][shippingStatus];
        }
        events.push({ 
            title: timelineConfig.IN_TRANSIT.title, 
            status: order.status === 'IN_TRANSIT' ? 'current' : 'completed', 
            description 
        });
    }

    // Completed
    if (order.status === 'DELIVERED') {
        events.push({ title: 'Completed', status: 'completed' });
    }

    return events;
}

// Sample data for Ship24
console.log('\n=== Ship24 Sample Tests ===');
const ship24Samples = [
    { status: 'PROCESSING', shipping: { provider: 'ship24', status: 'PROCESSING' }, isPaid: true },
    { status: 'IN_TRANSIT', shipping: { provider: 'ship24', status: 'IN_TRANSIT' }, isPaid: true },
    { status: 'DELIVERED', shipping: { provider: 'ship24', status: 'DELIVERED' }, isPaid: true },
];

ship24Samples.forEach((sample, index) => {
    console.log(`\nSample ${index + 1} (status: ${sample.status}):`);
    const timeline = generateTimeline(sample);
    console.log(JSON.stringify(timeline, null, 2));
});

// Sample data for TrackingMore
console.log('\n=== TrackingMore Sample Tests ===');
const trackingMoreSamples = [
    { status: 'PROCESSING', shipping: { provider: 'trackingmore', status: 'PROCESSING' }, isPaid: true },
    { status: 'IN_TRANSIT', shipping: { provider: 'trackingmore', status: 'Transit' }, isPaid: true },
    { status: 'DELIVERED', shipping: { provider: 'trackingmore', status: 'Delivered' }, isPaid: true },
];

trackingMoreSamples.forEach((sample, index) => {
    console.log(`\nSample ${index + 1} (status: ${sample.status}):`);
    const timeline = generateTimeline(sample);
    console.log(JSON.stringify(timeline, null, 2));
});
