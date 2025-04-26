document.addEventListener('DOMContentLoaded', () => {
    const dog = document.getElementById('dog');
    const sheep = document.getElementById('sheep');
    const fence = document.getElementById('fence');
    const gameContainer = document.querySelector('.game-container');
    
    // Set initial positions
    let dogX = window.innerWidth / 2;
    let dogY = window.innerHeight / 2;
    
    let sheepX = Math.random() * (window.innerWidth - 40);
    let sheepY = Math.random() * (window.innerHeight - 40);
    
    // Constants for collision detection
    const SHEEP_WIDTH = 40; // Width of sheep in pixels
    const MIN_DISTANCE = SHEEP_WIDTH * 1.25; // Minimum distance to maintain between dog and sheep (25% extra space)
    
    // Fence properties
    const fenceThickness = 7;
    let fenceSize = window.innerWidth > 768 ? 200 : 150;
    let fenceX = window.innerWidth / 2 - fenceSize / 2;
    let fenceY = window.innerHeight / 2 - fenceSize / 2;
    
    // Function to check if a point collides with the fence
    function checkFenceCollision(x, y, radius = 0) {
        // Check if point is inside the fence area
        const insideFenceX = x >= fenceX - radius && x <= fenceX + fenceSize + radius;
        const insideFenceY = y >= fenceY - radius && y <= fenceY + fenceSize + radius;
        
        if (insideFenceX && insideFenceY) {
            // Check if point is near any of the three closed sides of the fence (top, left, bottom)
            const nearTopSide = y < fenceY + fenceThickness + radius;
            const nearLeftSide = x < fenceX + fenceThickness + radius;
            const nearBottomSide = y > fenceY + fenceSize - fenceThickness - radius;
            // Right side is open: do NOT check nearRightSide
            // const nearRightSide = x > fenceX + fenceSize - fenceThickness - radius;
            
            // Return true if near any closed side (collision detected)
            return nearTopSide || nearLeftSide || nearBottomSide;
        }
        
        return false;
    }
    
    // Function to check if sheep is fully inside the fence enclosure
    function isSheepInEnclosure() {
        // The sheep is considered inside if its center is inside the inner area of the fence (not colliding with any side)
        const sheepCenterX = sheepX;
        const sheepCenterY = sheepY;
        const innerMargin = fenceThickness + SHEEP_WIDTH / 2;
        return (
            sheepCenterX > fenceX + innerMargin &&
            sheepCenterX < fenceX + fenceSize - innerMargin &&
            sheepCenterY > fenceY + innerMargin &&
            sheepCenterY < fenceY + fenceSize - innerMargin
        );
    }
    
    // Update dog position
    function updateDogPosition(x, y) {
        // Check if new position would collide with fence
        if (checkFenceCollision(x, y, 20)) {
            // Don't update position if it would cause collision
            return;
        }
        
        dogX = x;
        dogY = y;
        dog.style.left = `${x}px`;
        dog.style.top = `${y}px`;
    }
    
    // Update sheep position
    function updateSheepPosition() {
        sheep.style.left = `${sheepX}px`;
        sheep.style.top = `${sheepY}px`;
    }
    
    // Variables for smoother sheep movement
    let sheepDirection = Math.random() * Math.PI * 2;
    let sheepMovementTimer = 0;
    let sheepMovementInterval = Math.random() * 20 + 30; // Random interval for direction changes
    
    // Variable to control sheep movement after entering enclosure
    let sheepShouldMove = true;
    let sheepStopTimeout = null;
    
    // Calculate distance between dog and sheep
    function getDistanceBetween(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    // Move sheep in a more natural way
    function moveSheep() {
        // If sheep should not move, exit early
        if (!sheepShouldMove) return;
        
        // Occasionally change direction to create more natural movement
        sheepMovementTimer++;
        if (sheepMovementTimer > sheepMovementInterval) {
            // Change direction slightly instead of completely random
            sheepDirection += (Math.random() - 0.5) * 0.8; // Small direction adjustment
            sheepMovementInterval = Math.random() * 20 + 30; // Set new interval
            sheepMovementTimer = 0;
        }
        
        // Check if dog is too close to sheep
        const distanceToDog = getDistanceBetween(dogX, dogY, sheepX, sheepY);
        
        // Calculate speed (make it 30% faster)
        let sheepSpeed = (window.innerWidth > 768 ? 4 : 2.5) * 1.3;
        if (distanceToDog < 120) {
            sheepSpeed *= 1.1; // Slightly faster when dog is close
        }
        
        // If dog is too close, actively push sheep away
        if (distanceToDog < MIN_DISTANCE) {
            // Calculate direction away from dog
            const awayAngle = Math.atan2(sheepY - dogY, sheepX - dogX);
            // Move sheep away by the overlap amount (so it is pushed, not just teleported)
            const overlap = MIN_DISTANCE - distanceToDog;
            sheepX += Math.cos(awayAngle) * overlap;
            sheepY += Math.sin(awayAngle) * overlap;
            // Make sheep run away from the dog for a short burst
            sheepDirection = awayAngle + (Math.random() - 0.5) * 0.5; // Add some randomness
            // Optional: give a burst of speed
            sheepX += Math.cos(sheepDirection) * sheepSpeed * 1.5;
            sheepY += Math.sin(sheepDirection) * sheepSpeed * 1.5;
        } else {
            // Move sheep in the current direction
            sheepX += Math.cos(sheepDirection) * sheepSpeed;
            sheepY += Math.sin(sheepDirection) * sheepSpeed;
        }
        
        // Check if new position would collide with fence
        if (checkFenceCollision(sheepX, sheepY, SHEEP_WIDTH / 2)) {
            sheepX -= Math.cos(sheepDirection) * sheepSpeed;
            sheepY -= Math.sin(sheepDirection) * sheepSpeed;
            // Change direction randomly to avoid getting stuck
            sheepDirection += Math.PI + (Math.random() - 0.5) * 0.5;
        }
        
        sheepX = Math.max(20, Math.min(window.innerWidth - 20, sheepX));
        sheepY = Math.max(20, Math.min(window.innerHeight - 20, sheepY));
        
        updateSheepPosition();

        // Check for win condition
        if (!window.gameEnded && isSheepInEnclosure()) {
            window.gameEnded = true;
            // After 4 seconds, stop the sheep
            if (sheepStopTimeout) clearTimeout(sheepStopTimeout);
            sheepStopTimeout = setTimeout(() => {
                sheepShouldMove = false;
            }, 4000);
            setTimeout(() => {
                alert("Congratulations!");
            }, 100);
        }
    }
    
    // Handle mouse/touch movement
    function handlePointerMove(e) {
        let x, y;
        
        // Check if it's a touch event or mouse event
        if (e.type === 'touchmove') {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
            e.preventDefault(); // Prevent scrolling on touch devices
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        
        // Check if new position would be too close to sheep
        const distanceToSheep = getDistanceBetween(x, y, sheepX, sheepY);
        
        if (distanceToSheep < MIN_DISTANCE) {
            // Calculate direction from sheep to dog
            const angle = Math.atan2(y - sheepY, x - sheepX);
            // Set dog position at minimum distance from sheep
            x = sheepX + Math.cos(angle) * MIN_DISTANCE;
            y = sheepY + Math.sin(angle) * MIN_DISTANCE;
        }
        
        updateDogPosition(x, y);
    }
    
    // Set initial positions
    updateDogPosition(dogX, dogY);
    updateSheepPosition();
    window.gameEnded = false;
    
    // Event listeners for mouse and touch
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Update fence properties on resize
        fenceSize = window.innerWidth > 768 ? 200 : 150;
        fence.style.width = `${fenceSize}px`;
        fence.style.height = `${fenceSize}px`;
        
        // Update fence position variables
        fenceX = window.innerWidth / 2 - fenceSize / 2;
        fenceY = window.innerHeight / 2 - fenceSize / 2;
        
        // Keep sheep within bounds after resize
        sheepX = Math.min(window.innerWidth - 20, sheepX);
        sheepY = Math.min(window.innerHeight - 20, sheepY);
        updateSheepPosition();
    });
    
    // Start sheep movement with appropriate interval for animation
    setInterval(moveSheep, 100); // Significantly decreased interval for much faster movement
});