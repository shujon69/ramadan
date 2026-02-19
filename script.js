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

// ✅ আযানের অডিও সেটআপ
const alarmSound = new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3');
alarmSound.preload = 'auto';

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

        // ১. ডাটা লোড
        const todayData = dhakaCalendar[0]; 
        const tomorrowData = dhakaCalendar[1];

        // ২. অফসেট যোগ করা (আজকের)
        const sehriTimeStr = addMinutes(todayData.sehri, currentOffset);
        const iftarTimeStr = addMinutes(todayData.iftar, currentOffset);

        // ৩. অফসেট যোগ করা (আগামীকালের)
        if(tomorrowData) {
            const tomSehri = addMinutes(tomorrowData.sehri, currentOffset);
            const tomIftar = addMinutes(tomorrowData.iftar, currentOffset);
            const tomSehriEl = document.getElementById('tom-sehri');
            const tomIftarEl = document.getElementById('tom-iftar');
            if(tomSehriEl) tomSehriEl.innerText = formatTime12(tomSehri);
            if(tomIftarEl) tomIftarEl.innerText = formatTime12(tomIftar);
        }

        // ৪. UI আপডেট
        sehriEl.innerText = formatTime12(sehriTimeStr);
        iftarEl.innerText = formatTime12(iftarTimeStr);

        // ৫. বর্তমান ঘড়ি
        updateCurrentClock(now);

        // ৬. ডেট অবজেক্ট (AM/PM ফিক্সড)
        const todaySehri = createDateFromTime(sehriTimeStr, false); // AM
        const todayIftar = createDateFromTime(iftarTimeStr, true);  // PM

        // ৭. লজিক চেক
        let targetTime, mode;

        if (now < todaySehri) {
            targetTime = todaySehri;
            mode = "সাহরির বাকি";
            // সাহরির জন্য: ১৫ মিনিট আগে নোটিফিকেশন, সাউন্ড বন্ধ (false)
            checkAlarm(targetTime, 15, false);
        } 
        else if (now >= todaySehri && now < todayIftar) {
            targetTime = todayIftar;
            mode = "ইফতারের বাকি";
            // ইফতারের জন্য: ০ মিনিটে সাউন্ড চালু (true) - অটো প্লে হবে
            checkAlarm(targetTime, 0, true);
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

    // সাউন্ড ইনিশিয়াল (একবার স্ক্রিনে টাচ করলেই সাউন্ড আনলক হবে)
    document.body.addEventListener('click', () => {
        alarmSound.play().then(() => {
            alarmSound.pause(); alarmSound.currentTime = 0;
        }).catch(() => {});
    }, { once: true });
}

// ==========================================
// হেল্পার ফাংশন
// ==========================================

// ✅ ফিক্সড অ্যালার্ম লজিক
let alarmTriggered = false;
function checkAlarm(targetTime, offsetMinutes, playSound) {
    const now = new Date();
    // অ্যালার্ম টাইম বের করা
    const alarmTime = new Date(targetTime.getTime() - offsetMinutes * 60000);
    
    // ১ মিনিটের উইন্ডো সেট করা (এটিই আগের সমস্যার সমাধান)
    const windowEnd = new Date(alarmTime.getTime() + 60000);

    // যদি বর্তমান সময় অ্যালার্ম টাইমের মধ্যে পড়ে
    if (now >= alarmTime && now < windowEnd && !alarmTriggered) {
        
        // শুধু ইফতার হলে আযান প্লে হবে
        if (playSound) {
            alarmSound.play().catch((e) => console.log("Sound Autoplay Blocked:", e));
        }

        // নোটিফিকেশন
        let msg = playSound ? "ইফতারের সময় হয়েছে! 🕌" : `সাহরি শেষ হতে আর ${offsetMinutes} মিনিট বাকি! ⏳`;
        
        if (Notification.permission === "granted") {
            new Notification("রমজান অ্যালার্ট", {
                body: msg,
                icon: './icon.png'
            });
        }
        
        alarmTriggered = true;
        
        // ৩ মিনিট পর রিসেট (যাতে আযান পুরোটা বাজে)
        setTimeout(() => alarmTriggered = false, 180000);
    }
}

function updateCurrentClock(now) {
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
    const clockEl = document.getElementById('current-clock');
    if(clockEl) clockEl.innerText = strTime;
}

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

function addMinutes(timeStr, minutesToAdd) {
    let [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + minutesToAdd);
    let h = date.getHours();
    let m = date.getMinutes();
    return `${h}:${m < 10 ? '0'+m : m}`;
}

function formatTime12(time24) {
    let [hours, minutes] = time24.split(':');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

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
