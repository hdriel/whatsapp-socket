// הגדרות כתובות השרת (שנה לכתובות האמיתיות שלך)
const BASE_URL = 'https://your-server-api.com';
const SOCKET_URL = 'https://your-server-api.com';
console.log('hello world!');

// חיבור ל-Websocket
const socket = io(SOCKET_URL);

// האזנה לקבלת QR Code מהשרת
socket.on('qr', (qrData) => {
    // מניח שהשרת שולח מחרוזת Base64 או URL של תמונה
    const qrImage = document.getElementById('qr-image');
    qrImage.src = qrData;
    showQRSection(true);
});

// פונקציות עזר לממשק
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

// בקשות רשת (POST)
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

// פעולות כפתורים
function login() {
    apiRequest('login');
}

function logout() {
    apiRequest('logout');
}

function resetSystem() {
    // שליחת בקשת איפוס והצגת אזור ה-QR (שימולא ע"י ה-Socket)
    apiRequest('reset');
    showQRSection(true);
}

async function sendMessage() {
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    if (!phone) return alert('הכנס מספר טלפון');

    // שליחה לשרת המנגיש קבצים/הודעות כפי שביקשת
    await apiRequest('send-message', {
        number: phone,
        text: message,
    });
}
