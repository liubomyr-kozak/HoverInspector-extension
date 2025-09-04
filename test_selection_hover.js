// Test script to verify hover highlighting in streamSelectionMode
// This script can be run in a browser console to test the functionality

console.log("Testing streamSelectionMode hover highlighting...");

// Import or get the HighlightOverlayManager instance
const manager = window.HighlightOverlayManager?.getInstance() || 
                window.HoverInspectorExtension?.highlightOverlayManager;

if (!manager) {
    console.error("HighlightOverlayManager not found. Make sure the extension is loaded.");
} else {
    console.log("HighlightOverlayManager found, starting selection mode test...");
    
    // Start stream selection mode
    const subscription = manager.streamSelectionMode().subscribe({
        next: (event) => {
            console.log("Selection event:", event);
            if (event.type === "selected") {
                console.log("Element selected:", event.element);
                console.log("XPath:", event.xpath);
            }
        },
        complete: () => {
            console.log("Selection mode completed");
        },
        error: (err) => {
            console.error("Selection mode error:", err);
        }
    });
    
    console.log("Selection mode started! Move your mouse over elements to see hover highlighting.");
    console.log("Click on an element to select it, or press Escape to cancel.");
    
    // Auto-cleanup after 30 seconds for testing purposes
    setTimeout(() => {
        if (subscription && !subscription.closed) {
            subscription.unsubscribe();
            console.log("Test auto-cleanup: Selection mode stopped after 30 seconds");
        }
    }, 30000);
}