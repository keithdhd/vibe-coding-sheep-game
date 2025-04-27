document.addEventListener('DOMContentLoaded', () => {
    const dog = document.getElementById('dog');
    const fence = document.getElementById('fence');
    const gameContainer = document.querySelector('.game-container');
    
    // Set initial positions
    let dogX = window.innerWidth / 2;
    let dogY = window.innerHeight / 2;
    
    // Constants for collision detection
    const SHEEP_WIDTH = 40; // Width of sheep in pixels
    const MIN_DISTANCE = SHEEP_WIDTH * 1.25; // Minimum distance to maintain between dog and sheep (half sheep width extra space)
    
    // Fence properties
    const fenceThickness = 7;
    let fenceSize = window.innerWidth > 768 ? 200 : 150;
    let fenceX = window.innerWidth / 2 - fenceSize / 2;
    let fenceY = window.innerHeight / 2 - fenceSize / 2;
    
    // Helper: check if point is crossing fence (except right side is open)
    function isCrossingFenceExceptRight(x, y, radius = 0) {
        // Only block if crossing top, left, or bottom sides
        const leftEdge = fenceX;
        const rightEdge = fenceX + fenceSize;
        const topEdge = fenceY;
        const bottomEdge = fenceY + fenceSize;
        // Allow crossing if on or right of the right edge
        if (x >= rightEdge + radius) return false;
        // Block if within fence area and near any of the other three sides
        const nearTop = y < topEdge + fenceThickness + radius;
        const nearLeft = x < leftEdge + fenceThickness + radius;
        const nearBottom = y > bottomEdge - fenceThickness - radius;
        return (x > leftEdge - radius && x < rightEdge + radius && y > topEdge - radius && y < bottomEdge + radius) && (nearTop || nearLeft || nearBottom);
    }

    // Function to check if a point collides with the fence
    function checkFenceCollision(x, y, radius = 0) {
        // Check if point is inside the fence area
        const insideFenceX = x >= fenceX - radius && x <= fenceX + fenceSize + radius;
        const insideFenceY = y >= fenceY - radius && y <= fenceY + fenceSize + radius;
        
        if (insideFenceX && insideFenceY) {
            // Check if point is near any of the four sides of the fence
            const nearTopSide = y < fenceY + fenceThickness + radius;
            const nearLeftSide = x < fenceX + fenceThickness + radius;
            const nearBottomSide = y > fenceY + fenceSize - fenceThickness - radius;
            const nearRightSide = x > fenceX + fenceSize - fenceThickness - radius;
            
            // Return true if near any side (collision detected)
            return nearTopSide || nearLeftSide || nearBottomSide || nearRightSide;
        }
        
        return false;
    }
    
    // Update dog position
    function updateDogPosition(x, y) {
        if (isCrossingFenceExceptRight(x, y, 20)) {
            return;
        }
        dogX = x;
        dogY = y;
        dog.style.left = `${x}px`;
        dog.style.top = `${y}px`;
    }

    // SHEEP MANAGEMENT
    const NUM_SHEEP = 11;
    let sheepArray = [];
    let sheepElements = [];
    
    // Create sheep divs dynamically
    if (!gameContainer) {
        console.error('gameContainer not found!');
    }
    for (let i = 0; i < NUM_SHEEP; i++) {
        const sheepDiv = document.createElement('div');
        sheepDiv.className = 'sheep';
        sheepDiv.innerHTML = `
            <div class="sheep-ear left"></div>
            <div class="sheep-ear right"></div>
            <div class="sheep-face"></div>
            <div class="sheep-eye left"></div>
            <div class="sheep-eye right"></div>
            <div class="sheep-leg left"></div>
            <div class="sheep-leg right"></div>
        `;
        gameContainer.appendChild(sheepDiv);
        sheepElements.push(sheepDiv);
        // Random initial positions OUTSIDE the fence
        let x, y;
        let tries = 0;
        do {
            x = Math.random() * (window.innerWidth - 40);
            y = Math.random() * (window.innerHeight - 40);
            tries++;
        } while (
            x > fenceX && x < fenceX + fenceSize &&
            y > fenceY && y < fenceY + fenceSize &&
            tries < 100
        );
        sheepArray.push({
            x: x,
            y: y,
            direction: Math.random() * Math.PI * 2,
            movementTimer: 0,
            movementInterval: Math.random() * 20 + 30,
            enteredTime: null, // track when entered enclosure
            stopped: false // track if stopped
        });
    }
    console.log('Sheep elements created:', sheepElements.length);
    
    // Update sheep positions
    function updateSheepPositions() {
        for (let i = 0; i < NUM_SHEEP; i++) {
            if (sheepElements[i]) {
                sheepElements[i].style.left = `${sheepArray[i].x}px`;
                sheepElements[i].style.top = `${sheepArray[i].y}px`;
            } else {
                console.warn('Missing sheep element at index', i);
            }
        }
    }

    // Move all sheep
    function moveSheep() {
        const now = Date.now();
        for (let i = 0; i < NUM_SHEEP; i++) {
            let sheep = sheepArray[i];
            // Check if sheep is in enclosure
            const inEnclosure = isSheepInEnclosure(sheep);
            if (inEnclosure) {
                if (sheep.enteredTime === null) {
                    sheep.enteredTime = now;
                } else if (!sheep.stopped && now - sheep.enteredTime >= 3000) {
                    sheep.stopped = true;
                }
            } else {
                sheep.enteredTime = null;
                sheep.stopped = false;
            }
            if (sheep.stopped) {
                continue; // skip movement if stopped
            }
            sheep.movementTimer++;
            if (sheep.movementTimer > sheep.movementInterval) {
                sheep.direction += (Math.random() - 0.5) * 0.8;
                sheep.movementInterval = Math.random() * 20 + 30;
                sheep.movementTimer = 0;
            }
            // Store previous position
            const prevX = sheep.x;
            const prevY = sheep.y;
            // Check if dog is too close to this sheep
            const distanceToDog = getDistanceBetween(dogX, dogY, sheep.x, sheep.y);
            if (distanceToDog < MIN_DISTANCE) {
                // Move away from dog
                const angle = Math.atan2(sheep.y - dogY, sheep.x - dogX);
                sheep.direction = angle;
                sheep.x += Math.cos(sheep.direction) * 10;
                sheep.y += Math.sin(sheep.direction) * 10;
            } else {
                sheep.x += Math.cos(sheep.direction) * 5;
                sheep.y += Math.sin(sheep.direction) * 5;
            }
            // Block crossing fence except right side
            if (isCrossingFenceExceptRight(sheep.x, sheep.y, SHEEP_WIDTH / 2)) {
                sheep.x = prevX;
                sheep.y = prevY;
                // Bounce: reverse direction
                sheep.direction += Math.PI;
            }
            // Bounce off window edges
            if (sheep.x < 20 || sheep.x > window.innerWidth - 20) {
                sheep.direction = Math.PI - sheep.direction;
            }
            if (sheep.y < 20 || sheep.y > window.innerHeight - 20) {
                sheep.direction = -sheep.direction;
            }
            sheep.x = Math.max(20, Math.min(window.innerWidth - 20, sheep.x));
            sheep.y = Math.max(20, Math.min(window.innerHeight - 20, sheep.y));
        }
        updateSheepPositions();
        // Win condition: all sheep inside enclosure
        if (!window.gameEnded && sheepArray.every(isSheepInEnclosure)) {
            window.gameEnded = true;
            setTimeout(() => {
                alert("Congratulations! All sheep are in the enclosure!");
            }, 100);
        }
    }

    // Check if a sheep is in the enclosure
    function isSheepInEnclosure(sheep) {
        const sheepCenterX = sheep.x;
        const sheepCenterY = sheep.y;
        const innerMargin = fenceThickness + SHEEP_WIDTH / 2;
        return (
            sheepCenterX > fenceX + innerMargin &&
            sheepCenterX < fenceX + fenceSize - innerMargin &&
            sheepCenterY > fenceY + innerMargin &&
            sheepCenterY < fenceY + fenceSize - innerMargin
        );
    }

    // Utility: distance between two points
    function getDistanceBetween(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Handle pointer move
    function handlePointerMove(e) {
        let x, y;
        if (e.type === 'touchmove') {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
            e.preventDefault();
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        // Find closest sheep
        let minDist = Infinity;
        for (let i = 0; i < NUM_SHEEP; i++) {
            const dist = getDistanceBetween(x, y, sheepArray[i].x, sheepArray[i].y);
            if (dist < minDist) minDist = dist;
        }
        if (minDist < MIN_DISTANCE) {
            // Move dog only up to minimum distance from closest sheep
            // (use the closest sheep's position)
            let closestSheep = sheepArray.reduce((closest, sheep) => {
                const dist = getDistanceBetween(x, y, sheep.x, sheep.y);
                return dist < getDistanceBetween(x, y, closest.x, closest.y) ? sheep : closest;
            }, sheepArray[0]);
            const angle = Math.atan2(y - closestSheep.y, x - closestSheep.x);
            x = closestSheep.x + Math.cos(angle) * MIN_DISTANCE;
            y = closestSheep.y + Math.sin(angle) * MIN_DISTANCE;
        }
        updateDogPosition(x, y);
    }

    // --- INIT ---
    updateDogPosition(dogX, dogY);
    updateSheepPositions();
    window.gameEnded = false;
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('resize', () => {
        fenceSize = window.innerWidth > 768 ? 200 : 150;
        fence.style.width = `${fenceSize}px`;
        fence.style.height = `${fenceSize}px`;
        fenceX = window.innerWidth / 2 - fenceSize / 2;
        fenceY = window.innerHeight / 2 - fenceSize / 2;
        updateSheepPositions();
    });
    setInterval(moveSheep, 100);
});