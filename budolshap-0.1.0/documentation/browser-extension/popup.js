// Open Knowledge Base button
document.getElementById('openKB').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openKB' }, () => {
        window.close();
    });
});

// Open with Authentication button
document.getElementById('openWithAuth').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openWithAuth' }, () => {
        window.close();
    });
});



