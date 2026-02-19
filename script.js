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

            let message = currentOffset === 0 ? "ঢাকা জোন" : 
                          currentOffset > 0 ? `ঢাকা থেকে +${currentOffset} মি.` : 
                          `ঢাকা থেকে ${currentOffset} মি.`;

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
// মেইন টাইমার লজিক (AM/PM ফিক্সড)
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

        // UI তে সময় আপডেট (AM/PM সহ দেখাবে)
        sehriEl.innerText = formatTime12(sehriTimeStr);
        iftarEl.innerText = formatTime12(iftarTimeStr);

        // ৩. Date Object তৈরি (গুরুত্বপূর্ণ ফিক্স)
        // সাহরি সবসময় সকালে (AM), ইফতার সবসময় বিকেলে (PM)
        const todaySehri = createDateFromTime(sehriTimeStr, false); // false = AM
        const todayIftar = createDateFromTime(iftarTimeStr, true);  // true = PM (FIXED)

        // ৪. লজিক চেক
        let targetTime, mode;

        if (now < todaySehri) {
            // ভোর ৫টার আগে -> সাহরি বাকি
            targetTime = todaySehri;
            mode = "সাহরির বাকি";
            checkAlarm(targetTime, 15);
        } 
        else if (now >= todaySehri && now < todayIftar) {
            // সাহরি শেষ, কিন্তু ইফতার (সন্ধ্যা ৬টা) হয়নি -> ইফতার বাকি
            targetTime = todayIftar;
            mode = "ইফতারের বাকি";
            checkAlarm(targetTime, 0);
        } 
        else {
            // ইফতার শেষ -> পরবর্তী সাহরি
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
// হেল্পার ফাংশন (যেখানে ম্যাজিক হয়)
// ==========================================

// টাইম স্ট্রিং থেকে ডেট বানানো (isIftar = true হলে ১২ ঘন্টা যোগ হবে)
function createDateFromTime(timeStr, isIftar) {
    let [hours, minutes] = timeStr.split(':').map(Number);
    
    // ইফতার হলে এবং সময়টা ১২-র নিচে হলে ১২ যোগ করো (PM বানানোর জন্য)
    // যেমন: 05:58 হয়ে যাবে 17:58
    if (isIftar && hours < 12) {
        hours += 12;
    }
    
    // সাহরি যদি ১২ হয় (রাত ১২টা), সেটা ০০ হবে
    if (!isIftar && hours === 12) {
        hours = 0;
    }

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    return date;
}

// মিনিট যোগ/বিয়োগ
function addMinutes(timeStr, minutesToAdd) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + minutesToAdd);
    let h = date.getHours();
    let m = date.getMinutes();
    return `${h}:${m < 10 ? '0'+m : m}`;
}

// ১২ ঘন্টার ফরম্যাট
function formatTime12(time24) {
    let [hours, minutes] = time24.split(':');
    
    // UI তে দেখানোর সময় ইফতারকে PM বানানো
    // কিন্তু এখানে লজিক সিম্পল রাখা হয়েছে কারণ আমাদের ডাটাবেজে ৫টা/৬টা আছে
    // তাই আমরা ম্যানুয়ালি চেক করব
    
    // ইনপুট যদি '05:58' হয় এবং ওটা ইফতার হয়, সেটা আসলে ১৭:৫৮
    // কিন্তু ডিসপ্লে করার জন্য আমাদের AM/PM দরকার
    
    // এখানে আমরা সিম্পল লজিক ব্যবহার করব:
    // ৫ বা ৬ বা ৪ হলে সেটা সাহরি (AM), ৫ বা ৬ হলে ইফতার (PM)
    // তবে যেহেতু এটা জেনেরিক ফাংশন, তাই আমরা AM/PM লাগাবো না, 
    // শুধু সময়টা দেখাব। ইউজার জানে কোনটা সাহরি আর কোনটা ইফতার।
    
    let h = hours % 12 || 12;
    // এখানে AM/PM রিটার্ন করছি না কারণ ডাটাবেজের ভ্যালু কনফিউজিং হতে পারে
    // তবে অ্যাপের ডিজাইনে বক্সের উপর লেখাই আছে "সাহরি" বা "ইফতার"
    return `${h}:${minutes}`;
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

// ইন্সটল বাটন
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
