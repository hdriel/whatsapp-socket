const BASE_URL = '';
const SOCKET_URL = '/';

const socket = io(SOCKET_URL);

socket.on('connected', () => console.log('connected!'));

let obj = {};
const copyCodeToClipboard = (code) => {
    obj[code] ||= () =>
        new Promise((resolve) => {
            navigator.clipboard
                .writeText(code)
                .then(resolve)
                .catch(() => null);
        });

    return obj[code];
};

socket.on('qr', ({ qrImage, qrCode }) => {
    const qrImageEl = document.getElementById('qr-image');
    qrImageEl.src = qrImage;
    qrImageEl.style.display = qrImage ? 'block' : 'none';

    const qrCodeEl = document.getElementById('qr-code');
    qrCodeEl.style.display = qrCode ? 'block' : 'none';
    qrCodeEl.innerText = qrCode ? `${qrCode.substring(0, 4)}-${qrCode.substring(4)}`.split('').join(' ') : '';
    qrCodeEl.removeEventListener('click', obj[qrCode]);
    qrCodeEl.addEventListener('click', copyCodeToClipboard(qrCode));

    showQRSection(true);
});

socket.on('qr-connected', () => {
    const qrImageEl = document.getElementById('qr-image');
    qrImageEl.src = '';
    qrImageEl.style.display = 'none';

    const qrCodeEl = document.getElementById('qr-code');
    qrCodeEl.innerText = '';
    qrCodeEl.style.display = 'none';

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
    const phone = document.getElementById('phone').value;
    await apiRequest('reset', { phone });
    showQRSection(true);
}

async function sendMessage() {
    const phone = document.getElementById('phone').value;
    if (!phone) return alert('הכנס מספר טלפון');

    const message = document.getElementById('message').value;
    const subtitle = document.getElementById('subtitle').value;
    const tel = document.getElementById('tel').value;
    const url = document.getElementById('url').value;
    const authCode = document.getElementById('auth-code').checked;

    await apiRequest('send-message', { phone, message, subtitle, tel, url, authCode });
}
