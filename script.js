// ==========================================
// ১. ডাটাবেজ: ইসলামিক ফাউন্ডেশন ২০২৬ (ঢাকা জোন)
// ==========================================
const dhakaCalendar = [
    { day: 1, sehri: "05:12", iftar: "05:58" },
    { day: 2, sehri: "05:11", iftar: "05:58" },
    { day: 3, sehri: "05:11", iftar: "05:59" },
    { day: 4, sehri: "05:10", iftar: "05:59" },
    { day: 5, sehri: "05:09", iftar: "06:00" },
    { day: 6, sehri: "05:08", iftar: "06:00" },
    { day: 7, sehri: "05:08", iftar: "06:01" },
    { day: 8, sehri: "05:07", iftar: "06:01" },
    { day: 9, sehri: "05:06", iftar: "06:02" },
    { day: 10, sehri: "05:05", iftar: "06:02" },
    { day: 11, sehri: "05:05", iftar: "06:03" },
    { day: 12, sehri: "05:04", iftar: "06:03" },
    { day: 13, sehri: "05:03", iftar: "06:04" },
    { day: 14, sehri: "05:02", iftar: "06:04" },
    { day: 15, sehri: "05:01", iftar: "06:05" },
    { day: 16, sehri: "05:00", iftar: "06:05" },
    { day: 17, sehri: "04:59", iftar: "06:06" },
    { day: 18, sehri: "04:58", iftar: "06:06" },
    { day: 19, sehri: "04:57", iftar: "06:07" },
    { day: 20, sehri: "04:57", iftar: "06:07" },
    { day: 21, sehri: "04:56", iftar: "06:07" },
    { day: 22, sehri: "04:55", iftar: "06:08" },
    { day: 23, sehri: "04:54", iftar: "06:08" },
    { day: 24, sehri: "04:53", iftar: "06:09" },
    { day: 25, sehri: "04:52", iftar: "06:09" },
    { day: 26, sehri: "04:51", iftar: "06:10" },
    { day: 27, sehri: "04:50", iftar: "06:10" },
    { day: 28, sehri: "04:49", iftar: "06:10" },
    { day: 29, sehri: "04:48", iftar: "06:11" },
    { day: 30, sehri: "04:47", iftar: "06:11" }
];

// Elements
const locationBox = document.getElementById('location-box');
const sehriEl = document.getElementById('sehri-time');
const iftarEl = document.getElementById('iftar-time');
const countdownEl = document.getElementById('countdown');
const statusText = document.getElementById('status-text');
const installBtn = document.getElementById('install-btn');
const dateBox = document.getElementById('current-date');
const alarmSound = new Audio('./alarm.mp3');

// গ্লোবাল ভেরিয়েবল
let currentOffset = 0; 
let timerInterval = null;

// ==========================================
// অ্যাপ শুরু
// ==========================================
function initApp() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    dateBox.innerText = today.toLocaleDateString('bn-BD', options);
    
    startLiveTimer();
    getLocation();
}

// ==========================================
// লোকেশন লজিক
// ==========================================
function getLocation() {
    if (navigator.geolocation) {
        locationBox.innerText = "📍 জিপিএস খোঁজা হচ্ছে...";
        navigator.geolocation.getCurrentPosition((position) => {
            const userLon = position.coords.longitude;
            const dhakaLon = 90.4125; 
            const diffDeg = dhakaLon - userLon; 
            currentOffset = Math.round(diffDeg * 4);

            let message = "";
            if (currentOffset > 0) message = `ঢাকা থেকে +${currentOffset} মি. (পশ্চিম)`;
            else if (currentOffset < 0) message = `ঢাকা থেকে ${currentOffset} মি. (পূর্ব)`;
            else message = "ঢাকা জোন";

            locationBox.innerHTML = `📍 অটোমেটিক ডিটেক্টেড <br><small>(${message})</small>`;
            locationBox.classList.remove('bg-secondary');
            locationBox.classList.add('bg-success');

        }, () => {
            locationBox.innerText = "📍 জিপিএস অফ - ঢাকা টাইম";
        });
    } else {
        locationBox.innerText = "❌ জিপিএস সাপোর্ট নেই";
    }
}

// ==========================================
// মেইন টাইমার লজিক
// ==========================================
function startLiveTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const now = new Date();

        // ১. ডাটাবেজ থেকে ১ম দিনের সময় নেওয়া (টেস্টিং)
        const todayData = dhakaCalendar[0]; 

        // ২. জিপিএস অফসেট যোগ করা
        const sehriTimeStr = addMinutes(todayData.sehri, currentOffset);
        const iftarTimeStr = addMinutes(todayData.iftar, currentOffset);

        // ৩. UI তে সময় আপডেট (AM/PM সহ) - এখানে ফিক্স করা হয়েছে
        sehriEl.innerText = formatTime12(sehriTimeStr);
        iftarEl.innerText = formatTime12(iftarTimeStr);

        // ৪. বর্তমান সময় আপডেট করা
        updateCurrentClock(now);

        // ৫. Date Object তৈরি
        const todaySehri = createDateFromTime(sehriTimeStr, false); // AM
        const todayIftar = createDateFromTime(iftarTimeStr, true);  // PM

        // ৬. লজিক চেক
        let targetTime, mode;

        if (now < todaySehri) {
            targetTime = todaySehri;
            mode = "সাহরির বাকি";
            checkAlarm(targetTime, 15);
        } 
        else if (now >= todaySehri && now < todayIftar) {
            targetTime = todayIftar;
            mode = "ইফতারের বাকি";
            checkAlarm(targetTime, 0);
        } 
        else {
            targetTime = new Date(todaySehri);
            targetTime.setDate(targetTime.getDate() + 1);
            mode = "পরবর্তী সাহরি";
        }

        statusText.innerText = mode;
        
        // কাউন্টডাউন
        const diff = targetTime - now;
        if (diff > 0) {
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            countdownEl.innerText = `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
        } else {
            countdownEl.innerText = "00:00:00";
        }

    }, 1000);

    // সাউন্ড ইনিশিয়াল
    document.body.addEventListener('click', () => {
        alarmSound.play().then(() => {
            alarmSound.pause(); alarmSound.currentTime = 0;
        }).catch(() => {});
    }, { once: true });
}

// ==========================================
// হেল্পার ফাংশন
// ==========================================

// বর্তমান ঘড়ি আপডেট
function updateCurrentClock(now) {
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    
    const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
    const clockEl = document.getElementById('current-clock');
    if(clockEl) clockEl.innerText = strTime;
}

// টাইম স্ট্রিং থেকে ডেট বানানো
function createDateFromTime(timeStr, isIftar) {
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (isIftar && hours < 12) hours += 12;
    if (!isIftar && hours === 12) hours = 0;
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
}

// মিনিট যোগ/বিয়োগ
function addMinutes(timeStr, minutesToAdd) {
    let [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + minutesToAdd);
    let h = date.getHours();
    let m = date.getMinutes();
    return `${h}:${m < 10 ? '0'+m : m}`;
}

// ✅ ১২ ঘন্টার ফরম্যাট (AM/PM ফিক্সড)
function formatTime12(time24) {
    let [hours, minutes] = time24.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 হলে 12 দেখাবে
    return `${hours}:${minutes} ${ampm}`;
}

// অ্যালার্ম
let alarmTriggered = false;
function checkAlarm(targetTime, offsetMinutes) {
    const now = new Date();
    const alarmTime = new Date(targetTime.getTime() - offsetMinutes * 60000);

    if (now >= alarmTime && now < targetTime && !alarmTriggered) {
        alarmSound.play().catch(() => {});
        if (Notification.permission === "granted") {
            new Notification("⏰ অ্যালার্ম", {
                body: `সময় হতে আর মাত্র ${offsetMinutes} মিনিট বাকি!`,
                icon: './icon.png'
            });
        }
        alarmTriggered = true;
        setTimeout(() => alarmTriggered = false, 120000);
    }
}

// PWA ইন্সটল
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});
installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') installBtn.style.display = 'none';
        deferredPrompt = null;
    }
});

initApp();
