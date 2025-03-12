document.getElementById('countBtn').addEventListener('click', () => {
    const wpm = parseInt(document.getElementById('wpm').value, 10);
    
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
