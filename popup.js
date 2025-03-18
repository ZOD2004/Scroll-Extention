console.log("popup is up");

document.addEventListener('DOMContentLoaded', () => {
    const incrementButton = document.getElementById('increment');
    const decrementButton = document.getElementById('decrement');
    const wpmInput = document.getElementById('wpm');
    const countBtn = document.getElementById('countBtn');  // Make sure this element exists

    // Check if the buttons and input field exist
    if (!incrementButton || !decrementButton || !wpmInput || !countBtn) {
        console.error('One or more elements are missing in the DOM.');
        return;
    }

    // Increment functionality
    incrementButton.addEventListener('click', () => {
        let currentWpm = parseInt(wpmInput.value, 10);
        if (currentWpm >= 50 && currentWpm < 600) {
            wpmInput.value = currentWpm + 50;
        }
    });

    // Decrement functionality
    decrementButton.addEventListener('click', () => {
        let currentWpm = parseInt(wpmInput.value, 10);
        if (currentWpm > 50 && currentWpm <= 600) {
            wpmInput.value = currentWpm - 50;
        }
    });

    // Count button click functionality
    countBtn.addEventListener('click', () => {
        const wpm = parseInt(wpmInput.value, 10);
        console.log("Popup: Button clicked, sending message with WPM =", wpm);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log("Popup: Found active tab:", tabs);
            chrome.tabs.sendMessage(tabs[0].id, { action: "startScrolling", wpm: wpm }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Popup: Error sending message:", chrome.runtime.lastError.message);
                } else {
                    console.log("Popup: Message sent successfully", response);
                }
            });
        });

        // Close popup
        window.close();
    });
});
