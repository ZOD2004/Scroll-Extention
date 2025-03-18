console.log("Content Script: Injected and running...");

let pcounter = false; // Boolean to track pause/play state

// Function to count words in the given text
function countWordsInText(text) {
    const words = text.match(/\w+('\w+)?/g);
    return words ? words.length : 0;
}

// Function to check if an element is visible in the viewport
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
}

// Function to calculate visible words
function calculateVisibleWords() {
    const elements = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    let totalWordCount = 0;

    elements.forEach((element) => {
        if (isElementVisible(element)) {
            totalWordCount += countWordsInText(element.innerText || element.textContent);
        }
    });

    console.log("Total visible words:", totalWordCount);
    return totalWordCount;
}

// Function to create a notification box for pause & countdown
function createNotificationBox() {
    let notification = document.getElementById("scrollNotification");
    if (!notification) {
        notification = document.createElement("div");
        notification.id = "scrollNotification";
        notification.style.position = "fixed";
        notification.style.top = "10px";
        notification.style.left = "50%";
        notification.style.transform = "translateX(-50%)"; // Move box to the top middle
        notification.style.backgroundColor = "black";
        notification.style.color = "white";
        notification.style.padding = "10px 15px";
        notification.style.borderRadius = "8px";
        notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        notification.style.fontSize = "16px";
        notification.style.fontWeight = "bold";
        notification.style.zIndex = "10000";
        notification.style.display = "none";
        document.body.appendChild(notification);
    }
    return notification;
}

// Function to create control buttons (Pause, Play, Stop)
function createControlButtons() {
    let controlBox = document.getElementById("scrollControls");
    if (!controlBox) {
        controlBox = document.createElement("div");
        controlBox.id = "scrollControls";
        controlBox.style.position = "fixed";
        controlBox.style.bottom = "10px";
        controlBox.style.right = "10px"; // Move control box to the left
        controlBox.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        controlBox.style.color = "white";
        controlBox.style.padding = "10px";
        controlBox.style.borderRadius = "5px";
        controlBox.style.display = "none";
        controlBox.style.zIndex = "10000";
        document.body.appendChild(controlBox);
    }
    controlBox.innerHTML = `
        <button id="pauseBtn">Pause</button>
        <button id="playBtn">Play</button>
        <button id="stopBtn">Stop</button>
    `;
    return controlBox;
}

// Function to calculate scrolling time
function calculateScrollMovements(totalWordCount, wpm) {
    const wordsPerMinute = Math.min(wpm || 200, 550);
    const readingTimeInSeconds = (totalWordCount / wordsPerMinute) * 60;
    const visibleHeight = window.innerHeight;
    const fullPageHeight = document.documentElement.scrollHeight;
    const scrollMovements = Math.ceil(fullPageHeight / visibleHeight);
    const scrollTimePerMovement = readingTimeInSeconds / scrollMovements;

    console.log("Scroll movements:", scrollMovements);
    console.log("Time per scroll movement:", scrollTimePerMovement);

    return { scrollMovements, scrollTimePerMovement };
}

// Function to start scrolling with countdown notifications
function simulateScrolling(scrollMovements, scrollTimePerMovement) {
    let scrollCount = 0;
    let isPaused = false;
    let isStopped = false;
    let notificationBox = createNotificationBox();
    let controlBox = createControlButtons();
    controlBox.style.display = "block";

    console.log("Starting scroll simulation...");

    function startCountdown(callback) {
        let countdown = 4;
        notificationBox.style.display = "block";

        function updateCountdown() {
            if (isPaused || isStopped) return;

            if (countdown > 0) {
                notificationBox.innerText = `Scrolling in ${countdown}...`;
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                notificationBox.innerText = "Scrolling...";
                setTimeout(() => {
                    notificationBox.style.display = "none";
                    callback();
                }, 1000); // Show "Scrolling..." for 1 second before actually scrolling
            }
        }

        updateCountdown();
    }

    function scrollLoop() {
        if (isStopped || scrollCount >= scrollMovements) {
            notificationBox.style.display = "none";
            controlBox.style.display = "none";
            console.log("Scrolling completed or stopped.");
            return;
        }

        if (!isPaused) {
            startCountdown(() => {
                window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
                scrollCount++;
                console.log("Scrolled:", scrollCount, "out of", scrollMovements);
                setTimeout(scrollLoop, scrollTimePerMovement * 1000);
            });
        }
    }

    document.getElementById("pauseBtn").onclick = () => {
        pcounter = !pcounter;
        isPaused = pcounter;
        notificationBox.innerText = isPaused ? "Scrolling is paused. Press 'P' to resume." : "";
        notificationBox.style.display = isPaused ? "block" : "none";
    };

    document.getElementById("playBtn").onclick = () => {
        if (isPaused) {
            isPaused = false;
            notificationBox.style.display = "none";
            scrollLoop();
        }
    };

    document.getElementById("stopBtn").onclick = () => {
        isStopped = true;
        controlBox.remove();
        notificationBox.remove();
    };

    window.addEventListener("keydown", (event) => {
        if (event.key === "p" || event.key === "P") {
            document.getElementById("pauseBtn").click();
        } else if (event.key === "q" || event.key === "Q") {
            document.getElementById("stopBtn").click();
        }
    });

    scrollLoop();
}

// Listen for messages from popup.js to start scrolling
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startScrolling") {
        console.log("Message received: startScrolling");
        let totalWordCount = calculateVisibleWords();
        let { scrollMovements, scrollTimePerMovement } = calculateScrollMovements(totalWordCount, message.wpm);
        simulateScrolling(scrollMovements, scrollTimePerMovement);
    }
});

