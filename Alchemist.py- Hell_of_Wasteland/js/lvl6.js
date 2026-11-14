/* ============================================================
   ALCHEMIST.PY — LEVEL 6: THE MAGIC CIRCLE
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Generate a random radius between 3 and 15
var CIRCLE_RADIUS = Math.floor(Math.random() * 13) + 3;

// The correct area (rounded to 2 decimal places)
var CORRECT_AREA = Math.round(3.14 * CIRCLE_RADIUS * CIRCLE_RADIUS * 100) / 100;

// Dialogue lines — continuing the story after levels 3, 4, 5
var DIALOGUE_LINES = [
    "After all those trials, we have finally reached the alchemist's chamber...",
    "Look! A magic circle etched into the stone floor.",
    "The ancient runes have faded. The circle's power is drained.",
    "To reactivate it, we must fill it with the correct amount of magic energy.",
    "The circle's radius is " + CIRCLE_RADIUS + " units. We need to calculate its area.",
    "Remember the formula: Area = π × r²",
    "Use Python to calculate and print the area. Use 3.14159 for π.",
    "Click on me to open the Arcane Calculator..."
];

// Room images
var ROOM_IMAGES = {
    dark: '../assets/Level6/magic_circle_dark.png',
    activated: '../assets/Level6/magic_circle_activated.png'
};

// ============================================================
// STATE
// ============================================================
var dialogueIndex = 0;
var typingTimeout = null;
var isTyping = false;
var pyodideReady = false;
var particles = [];
var magicFill = 0;
var circleActivated = false;
var attemptsCount = 0;

// ============================================================
// DOM REFS
// ============================================================
var roomImage = document.getElementById('room-image');
var circleGlow = document.getElementById('circle-glow');
var magicBarFill = document.getElementById('magic-bar-fill');
var magicPercentEl = document.getElementById('magic-percent');
var magicHud = document.getElementById('magic-hud');
var radiusHud = document.getElementById('radius-hud');
var radiusValue = document.getElementById('radius-value');
var areaStatus = document.getElementById('area-status');
var catSprite = document.getElementById('the-cat-lvl6');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl6');
var grimoireOverlay = document.getElementById('grimoire-overlay');
var grimoireClose = document.getElementById('grimoire-close');
var spellTaskText = document.getElementById('spell-task-text');
var codeInput = document.getElementById('code-input');
var lineNumbers = document.getElementById('line-numbers');
var outputText = document.getElementById('output-text');
var btnCastSpell = document.getElementById('btn-cast-spell');
var btnClear = document.getElementById('btn-clear');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var btnContinue = document.getElementById('btn-continue');
var particleCanvas = document.getElementById('spell-particles');
var particleCtx = particleCanvas.getContext('2d');

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Init Pyodide
    initPython().then(function () {
        pyodideReady = true;
    }).catch(function (e) {
        console.error("Pyodide failed to load:", e);
    });

    // Set radius display
    radiusValue.textContent = 'Radius: ' + CIRCLE_RADIUS + ' units';

    // Show cat & start dialogue after short delay
    setTimeout(function () {
        catSprite.style.display = 'block';
        dialogueBox.style.display = 'block';
        showDialogue(0);
    }, 800);

    // Cat click → open grimoire
    catSprite.addEventListener('click', openGrimoire);

    // Grimoire controls
    grimoireClose.addEventListener('click', closeGrimoire);
    btnCastSpell.addEventListener('click', castSpell);
    btnClear.addEventListener('click', function () {
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();
    });

    // Line numbers
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', syncScroll);
    updateLineNumbers();

    // Continue button
    btnContinue.addEventListener('click', function () {
        showLevelLoading('lvl7.html', 'Loading Level 7...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add circle pulse to room
    roomImage.classList.add('circle-pulse');
});

// ============================================================
// DIALOGUE SYSTEM
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        radiusHud.classList.add('visible');
        magicHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    typewriterText.innerHTML = '';
    var text = DIALOGUE_LINES[index];
    var charIdx = 0;

    function typeChar() {
        if (charIdx < text.length) {
            typewriterText.innerHTML += text.charAt(charIdx);
            charIdx++;
            typingTimeout = setTimeout(typeChar, 35);
        } else {
            isTyping = false;
            var prompt = document.createElement('div');
            prompt.className = 'click-prompt';
            prompt.textContent = '▼ CLICK TO CONTINUE ▼';
            typewriterText.appendChild(prompt);
        }
    }

    typeChar();
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        typewriterText.textContent = DIALOGUE_LINES[dialogueIndex];
        var prompt = document.createElement('div');
        prompt.className = 'click-prompt';
        prompt.textContent = '▼ CLICK TO CONTINUE ▼';
        typewriterText.appendChild(prompt);
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_LINES.length) {
        showDialogue(dialogueIndex);
    } else {
        radiusHud.classList.add('visible');
        magicHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE (Code Editor)
// ============================================================
function openGrimoire() {
    if (circleActivated) return;

    spellTaskText.textContent = "The magic circle has radius = " + CIRCLE_RADIUS + ". Calculate and print the area using the formula: area = 3.14159 * r * r";
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();

    grimoireOverlay.classList.add('open');
    codeInput.focus();
}

function closeGrimoire() {
    grimoireOverlay.classList.remove('open');
}

// ============================================================
// CAST SPELL (Run Python Code)
// ============================================================
function castSpell() {
    if (!pyodideReady) {
        outputText.textContent = "⏳ Python is still loading... please wait.";
        outputText.className = 'error';
        return;
    }

    var code = codeInput.value.trim();
    if (!code) {
        outputText.textContent = "✏️ Write your code first!";
        outputText.className = 'error';
        return;
    }

    attemptsCount++;
    outputText.textContent = "🔮 Calculating...";
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        processOutput(result);
    });
}

function processOutput(result) {
    // Check for errors
    if (result.indexOf('Error:') === 0) {
        if (result.indexOf('I/O error') !== -1 || result.indexOf('input') !== -1) {
            outputText.textContent = "❌ input() does not work in browser!\n\n" +
                "💡 Set the radius directly:\n\n" +
                "r = " + CIRCLE_RADIUS + "\n" +
                "area = 3.14159 * r * r\n" +
                "print(area)";
        } else {
            outputText.textContent = "❌ Code Failed!\n" + result;
        }
        outputText.className = 'error';
        shakeGrimoire();
        return;
    }

    // Parse the output — look for a number
    var output = result.trim();
    var lines = output.split('\n');
    var foundValue = null;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var num = parseFloat(line);
        if (!isNaN(num)) {
            foundValue = num;
            break;
        }
    }

    if (foundValue === null) {
        outputText.textContent = "Output: " + result + "\n\n⚠️ Your code must print a NUMBER (the area).\n" +
            "💡 Hint:\nr = " + CIRCLE_RADIUS + "\narea = 3.14159 * r * r\nprint(area)";
        outputText.className = 'error';
        shakeGrimoire();
        return;
    }

    // Round both to 2 decimal places for comparison
    var userArea = Math.round(foundValue * 100) / 100;
    var expectedArea = CORRECT_AREA;

    // Allow small tolerance
    var diff = Math.abs(userArea - expectedArea);
    var tolerance = expectedArea * 0.01; // 1% tolerance

    if (diff > tolerance) {
        // Check if they used 3.14 instead of 3.14159 (common)
        var area314 = Math.round(3.14 * CIRCLE_RADIUS * CIRCLE_RADIUS * 100) / 100;
        var diff314 = Math.abs(userArea - area314);

        if (diff314 <= tolerance) {
            // Close enough with 3.14
            expectedArea = area314;
        } else {
            outputText.textContent = "Output: " + result + "\n\n❌ Incorrect area!\n" +
                "Your answer: " + userArea + "\n" +
                "Expected: ~" + expectedArea + "\n\n" +
                "💡 Use: area = 3.14159 * " + CIRCLE_RADIUS + " * " + CIRCLE_RADIUS;
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }
    }

    // SUCCESS!
    outputText.textContent = "Output: " + result + "\n\n✨ CORRECT! Area = " + userArea + " sq. units\nThe magic circle fills with energy!";
    outputText.className = 'success';

    // Update HUD
    areaStatus.textContent = 'Area: ' + userArea + ' ✓';
    areaStatus.className = 'calculated';

    // Start fill animation
    animateMagicFill();
}

// ============================================================
// MAGIC FILL ANIMATION
// ============================================================
function animateMagicFill() {
    // Close grimoire
    setTimeout(function () {
        closeGrimoire();

        // Start filling the circle
        circleGlow.className = 'filling';
        emitSpellParticles(30);

        // Animate progress bar to 50%
        magicFill = 50;
        updateMagicBar();

        // Show dialogue
        dialogueBox.style.display = 'block';
        typewriterText.innerHTML = '';
        isTyping = true;
        var msg = "The magic energy flows into the circle... The runes begin to glow!";
        var charIdx = 0;

        function typeChar() {
            if (charIdx < msg.length) {
                typewriterText.innerHTML += msg.charAt(charIdx);
                charIdx++;
                setTimeout(typeChar, 25);
            } else {
                isTyping = false;
            }
        }
        typeChar();

        // Continue filling
        setTimeout(function () {
            magicFill = 100;
            updateMagicBar();
            emitSpellParticles(60);
            circleGlow.className = 'activated';

            // Switch to activated room image
            roomImage.style.backgroundImage = "url('" + ROOM_IMAGES.activated + "')";
            catSprite.style.filter = 'brightness(1)';

            dialogueBox.style.display = 'block';
            typewriterText.innerHTML = '';
            isTyping = true;
            var msg2 = "The circle is fully charged! Ancient magic surges through the chamber!";
            var c2 = 0;

            function typeChar2() {
                if (c2 < msg2.length) {
                    typewriterText.innerHTML += msg2.charAt(c2);
                    c2++;
                    setTimeout(typeChar2, 25);
                } else {
                    isTyping = false;
                }
            }
            typeChar2();

            // Show victory
            setTimeout(function () {
                dialogueBox.style.display = 'none';
                circleActivated = true;
                triggerVictory();
            }, 3000);
        }, 2500);
    }, 1800);
}

// ============================================================
// MAGIC BAR
// ============================================================
function updateMagicBar() {
    var clamped = Math.min(magicFill, 100);
    magicBarFill.style.width = clamped + '%';
    magicPercentEl.textContent = clamped + '%';
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    successStats.innerHTML =
        'CIRCLE RADIUS: ' + CIRCLE_RADIUS + ' units<br>' +
        'AREA CALCULATED: ' + CORRECT_AREA + ' sq. units<br>' +
        'FORMULA USED: π × r²<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'MAGIC RESTORED: 100%';

    successScreen.classList.add('show');
    emitSpellParticles(120);
}

// ============================================================
// GRIMOIRE SHAKE EFFECT
// ============================================================
function shakeGrimoire() {
    var container = document.getElementById('grimoire-container');
    container.style.animation = 'none';
    container.offsetHeight;
    container.style.animation = 'shake 0.4s ease';
}

var shakeStyle = document.createElement('style');
shakeStyle.textContent =
    '@keyframes shake {' +
    '0%, 100% { transform: translateX(0); }' +
    '20% { transform: translateX(-8px); }' +
    '40% { transform: translateX(8px); }' +
    '60% { transform: translateX(-5px); }' +
    '80% { transform: translateX(5px); }' +
    '}';
document.head.appendChild(shakeStyle);

// ============================================================
// LINE NUMBERS
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n');
    var nums = '';
    var count = Math.max(lines.length, 8);
    for (var i = 1; i <= count; i++) {
        nums += i + '\n';
    }
    lineNumbers.textContent = nums;
}

function syncScroll() {
    lineNumbers.scrollTop = codeInput.scrollTop;
}

// ============================================================
// PARTICLE SYSTEM
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function emitSpellParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: particleCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 4 + 2),
            size: Math.random() * 4 + 1,
            life: 1,
            decay: Math.random() * 0.015 + 0.005,
            color: getRandomSpellColor()
        });
    }
}

function getRandomSpellColor() {
    var colors = [
        '212, 56, 44',     // Crimson
        '255, 69, 0',      // Red-orange
        '255, 140, 107',   // Salmon
        '255, 215, 0',     // Gold
        '100, 180, 255',   // Magic blue
        '255, 100, 50'     // Ember
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    var alive = [];
    for (var i = 0; i < particles.length; i++) {
        if (particles[i].life > 0) {
            alive.push(particles[i]);
        }
    }
    particles = alive;

    for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ', ' + p.life + ')';
        particleCtx.fill();

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ', ' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }

    // Ambient particles based on magic fill
    if (magicFill > 0 && Math.random() < magicFill / 250) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(Math.random() * 0.5 + 0.2),
            size: Math.random() * 2 + 0.5,
            life: 0.6,
            decay: 0.005,
            color: '212, 56, 44'
        });
    }

    requestAnimationFrame(animateParticles);
}
