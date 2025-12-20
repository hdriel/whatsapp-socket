const BASE_URL = '';
const SOCKET_URL = '/';

const socket = io(SOCKET_URL);

socket.on('connected', () => console.log('connected!'));

socket.on('qr', (qrData) => {
    const qrImage = document.getElementById('qr-image');
    qrImage.src = qrData;
    showQRSection(true);
});

socket.on('qr-connected', () => {
    const qrImage = document.getElementById('qr-image');
    qrImage.src = '';
    showQRSection(false);
});

function showQRSection(show) {
    document.getElementById('qr-section').style.display = show ? 'flex' : 'none';
    document.getElementById('divider').style.display = show ? 'block' : 'none';
}

function closeQR() {
    showQRSection(false);
}

function updateStatus(text, color = '#666') {
    const el = document.getElementById('status-msg');
    el.innerText = text;
    el.style.color = color;
}

async function apiRequest(endpoint, data = {}) {
    try {
        updateStatus('שולח בקשה...');
        const response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            updateStatus('הפעולה הצליחה', 'green');
            return await response.json();
        } else {
            throw new Error('שגיאת שרת');
        }
    } catch (error) {
        updateStatus('נכשל: ' + error.message, 'red');
    }
}

async function login() {
    return apiRequest('connect');
}

async function logout() {
    return apiRequest('disconnect');
}

async function resetSystem() {
    await apiRequest('reset');
    showQRSection(true);
}

async function sendMessage() {
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
    if (!phone) return alert('הכנס מספר טלפון');

    await apiRequest('send-message', { phone, message });
}
