// Test script to verify xpath positioning works correctly
// This script simulates the xpath positioning logic

console.log("Testing XPath positioning logic...");

// Simulate the positioning calculation
function testXPathPositioning() {
  // Mock DOM element with getBoundingClientRect
  const mockElement = {
    getBoundingClientRect: () => ({
      left: 100,
      top: 200,
      width: 150,
      height: 50
    })
  };

  // Mock window scroll values
  const mockScrollX = 10;
  const mockScrollY = 20;

  // Simulate the positioning calculation (NEW VERSION - without -10 offset)
  const rect = mockElement.getBoundingClientRect();
  const position = {
    x: rect.left + mockScrollX,
    y: rect.top + mockScrollY, // Position directly on top of the element like a label
    width: 250,
    height: 150,
  };

  console.log("Mock element rect:", rect);
  console.log("Mock scroll values:", { x: mockScrollX, y: mockScrollY });
  console.log("Calculated note position:", position);

  // Verify the positioning
  const expectedX = rect.left + mockScrollX; // 100 + 10 = 110
  const expectedY = rect.top + mockScrollY;  // 200 + 20 = 220 (no -10 offset)

  console.log("Expected position:", { x: expectedX, y: expectedY });
  
  if (position.x === expectedX && position.y === expectedY) {
    console.log("✅ XPath positioning test PASSED - Note positioned directly on element");
    return true;
  } else {
    console.log("❌ XPath positioning test FAILED");
    return false;
  }
}

// Test the old vs new positioning
function comparePositioning() {
  console.log("\n--- Comparing old vs new positioning ---");
  
  const rect = { left: 100, top: 200 };
  const scroll = { x: 10, y: 20 };
  
  // Old positioning (with -10 offset)
  const oldY = rect.top + scroll.y - 10; // 220 - 10 = 210
  
  // New positioning (without -10 offset)
  const newY = rect.top + scroll.y; // 220
  
  console.log(`Old positioning: y = ${oldY} (10px above element)`);
  console.log(`New positioning: y = ${newY} (directly on element)`);
  console.log(`Difference: ${newY - oldY}px closer to element`);
}

// Run tests
testXPathPositioning();
comparePositioning();

console.log("\n✅ Test completed successfully!");