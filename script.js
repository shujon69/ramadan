// Elements
const locationBox = document.getElementById('location-box');
const sehriEl = document.getElementById('sehri-time');
const iftarEl = document.getElementById('iftar-time');
const countdownEl = document.getElementById('countdown');
const statusText = document.getElementById('status-text');
const installBtn = document.getElementById('install-btn');
const dateBox = document.getElementById('current-date');

// 1. Initialize App
function initApp() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateBox.innerText = new Date().toLocaleDateString('bn-BD', options);
    getLocation();
}

// 2. Get Location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchPrayerTimes, (error) => {
            locationBox.innerText = "⚠️ লোকেশন পারমিশন দিন";
            locationBox.classList.remove('bg-secondary');
            locationBox.classList.add('bg-danger');
        });
    } else {
        locationBox.innerText = "GPS সাপোর্ট নেই";
    }
}

// 3. Fetch Data from API
async function fetchPrayerTimes(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const date = new Date(); // আজকের তারিখ
    
    // API URL (Method 1: Muslim World League)
    const url = `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}?latitude=${lat}&longitude=${lon}&method=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const timings = data.data.timings;
        const meta = data.data.meta;

        locationBox.innerHTML = `📍 ${meta.timezone}`;
        locationBox.classList.remove('bg-secondary');
        locationBox.classList.add('bg-success');

        // Update UI
        sehriEl.innerText = formatTime12(timings.Fajr);
        iftarEl.innerText = formatTime12(timings.Maghrib);

        // Start Logic
        startCountdown(timings.Fajr, timings.Maghrib);
        requestNotificationPermission();

    } catch (error) {
        locationBox.innerText = "ইন্টারনেট সংযোগ নেই!";
    }
}

// Helper: Time Format
function formatTime12(time24) {
    let [hours, minutes] = time24.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// 4. Countdown & Alarm Logic
function startCountdown(fajr, maghrib) {
    setInterval(() => {
        const now = new Date();
        const sehriTime = new Date();
        const iftarTime = new Date();

        const [fHour, fMin] = fajr.split(':');
        const [mHour, mMin] = maghrib.split(':');

        sehriTime.setHours(fHour, fMin, 0);
        iftarTime.setHours(mHour, mMin, 0);

        let targetTime, mode;

        if (now < sehriTime) {
            targetTime = sehriTime;
            mode = "সাহরির বাকি";
            checkAlarm(targetTime, 15); // Alarm 15 min before
        } else if (now < iftarTime) {
            targetTime = iftarTime;
            mode = "ইফতারের বাকি";
            checkAlarm(targetTime, 0); // Alarm at Iftar
        } else {
            targetTime = sehriTime;
            targetTime.setDate(targetTime.getDate() + 1);
            mode = "পরবর্তী সাহরি";
        }

        statusText.innerText = mode;
        
        const diff = targetTime - now;
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        countdownEl.innerText = `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;

    }, 1000);
}

// 5. Notification Logic
function requestNotificationPermission() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

let alarmTriggered = false;
function checkAlarm(targetTime, offsetMinutes) {
    const now = new Date();
    const alarmTime = new Date(targetTime.getTime() - offsetMinutes * 60000);

    if (now >= alarmTime && now < targetTime && !alarmTriggered) {
        if (Notification.permission === "granted") {
            new Notification("সাহরি/ইফতার এলার্ম", {
                body: `সময় হতে আর মাত্র ${offsetMinutes} মিনিট বাকি!`,
                icon: './icon.png'
            });
            // Sound play code can be added here
        }
        alarmTriggered = true;
        setTimeout(() => alarmTriggered = false, 60000 * 2); // Reset after 2 mins
    }
}

// 6. PWA Install Logic (Updated)
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block'; // Show button
    console.log("Install Prompt Ready");
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    }
});

// Start App
initApp();