// jest.setup.js
// Polyfill for Baileys protobuf
if (typeof global.IMessageKey === 'undefined') {
    global.IMessageKey = class IMessageKey {
        constructor() {}
    };
}

if (typeof global.IMessage === 'undefined') {
    global.IMessage = class IMessage {
        constructor() {}
    };
}

// Add other protobuf classes that might be needed
global.IMessageKey.prototype = {};
global.IMessage.prototype = {};

// Suppress console warnings during tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
};
