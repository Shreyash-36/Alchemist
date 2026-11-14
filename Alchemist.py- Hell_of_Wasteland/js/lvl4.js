/* ============================================================
   ALCHEMIST.PY — LEVEL 4: THE DARK HALL
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================
const SPELLS = [
    {
        number: 3,
        task: "Write a Python spell to print the square of 3",
        hint: "Use: print(3 ** 2)  or  print(3 * 3)",
        expectedOutput: "9",
        lightGain: 20
    },
    {
        number: 5,
        task: "Write a Python spell to print the square of 5",
        hint: "Use: print(5 ** 2)",
        expectedOutput: "25",
        lightGain: 20
    },
    {
        number: 7,
        task: "Write a Python spell to print the square of 7",
        hint: "Use: print(7 ** 2)",
        expectedOutput: "49",
        lightGain: 20
    },
    {
        number: 12,
        task: "Write a Python spell to print the square of 12",
        hint: "Use: print(12 ** 2)",
        expectedOutput: "144",
        lightGain: 20
    },
    {
        number: 15,
        task: "Write a Python spell to print the square of 15",
        hint: "Use: print(15 ** 2)",
        expectedOutput: "225",
        lightGain: 20
    }
];

const DIALOGUE_LINES = [
    "Darkness... thick and suffocating.",
    "We have entered the Forgotten Hall.",
    "The torches have died. Only magic can reignite them.",
    "To cast a Light Spell, you must harness the power of SQUARING.",
    "Write Python code to square numbers. Each correct spell increases the light!",
    "Click on me when you are ready to open the Grimoire..."
];

// ============================================================
// STATE
// ============================================================
let currentSpellIndex = 0;
let lightIntensity = 0;
let dialogueIndex = 0;
var typingTimeout = null;
let isTyping = false;
let pyodideReady = false;
let particles = [];

// ============================================================
// DOM REFS
// ============================================================
const darknessOverlay   = document.getElementById('darkness-overlay');
const lightBarFill      = document.getElementById('light-bar-fill');
const lightPercent      = document.getElementById('light-percent');
const lightHud          = document.getElementById('light-hud');
const spellTracker      = document.getElementById('spell-tracker');
const spellSlots        = document.getElementById('spell-slots');
const catSprite         = document.getElementById('the-cat-lvl4');
const dialogueBox       = document.getElementById('dialogue-box');
const typewriterText    = document.getElementById('typewriter-text-lvl4');
const grimoireOverlay   = document.getElementById('grimoire-overlay');
const grimoireClose     = document.getElementById('grimoire-close');
const spellTaskText     = document.getElementById('spell-task-text');
const codeInput         = document.getElementById('code-input');
const lineNumbers       = document.getElementById('line-numbers');
const outputText        = document.getElementById('output-text');
const btnCastSpell      = document.getElementById('btn-cast-spell');
const btnClear          = document.getElementById('btn-clear');
const successScreen     = document.getElementById('success-screen');
const successStats      = document.getElementById('success-stats');
const btnContinue       = document.getElementById('btn-continue');
const particleCanvas    = document.getElementById('spell-particles');
const particleCtx       = particleCanvas.getContext('2d');

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Init Pyodide
    try {
        await initPython();
        pyodideReady = true;
    } catch (e) {
        console.error("Pyodide failed to load:", e);
    }

    // Build Spell Tracker Slots
    buildSpellTracker();

    // Show cat & start dialogue
    setTimeout(() => {
        catSprite.style.display = 'block';
        dialogueBox.style.display = 'block';
        showDialogue(0);
    }, 800);

    // Cat click → open grimoire
    catSprite.addEventListener('click', openGrimoire);

    // Grimoire controls
    grimoireClose.addEventListener('click', closeGrimoire);
    btnCastSpell.addEventListener('click', castSpell);
    btnClear.addEventListener('click', () => {
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
    btnContinue.addEventListener('click', () => {
        // Navigate to the next level (change as needed)
        showLevelLoading('lvl5.html', 'Loading Level 5...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();
});

// ============================================================
// DIALOGUE SYSTEM
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        // All dialogue done — show HUD elements
        lightHud.classList.add('visible');
        spellTracker.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    typewriterText.innerHTML = '';
    const text = DIALOGUE_LINES[index];
    let charIdx = 0;

    function typeChar() {
        if (charIdx < text.length) {
            typewriterText.innerHTML += text.charAt(charIdx);
            charIdx++;
            typingTimeout = setTimeout(typeChar, 35);
        } else {
            isTyping = false;
            // Add click prompt
            const prompt = document.createElement('div');
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
        const prompt = document.createElement('div');
        prompt.className = 'click-prompt';
        prompt.textContent = '▼ CLICK TO CONTINUE ▼';
        typewriterText.appendChild(prompt);
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_LINES.length) {
        showDialogue(dialogueIndex);
    } else {
        // Hide dialogue, show HUD
        lightHud.classList.add('visible');
        spellTracker.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// SPELL TRACKER
// ============================================================
function buildSpellTracker() {
    spellSlots.innerHTML = '';
    SPELLS.forEach((spell, i) => {
        const slot = document.createElement('div');
        slot.className = 'spell-slot ' + (i === 0 ? 'active' : 'pending');
        slot.id = `spell-slot-${i}`;

        const icon = document.createElement('span');
        icon.className = 'spell-slot-icon';
        icon.textContent = '🔮';

        const text = document.createElement('span');
        text.className = 'spell-slot-text';
        text.textContent = `${spell.number}² = ?`;

        slot.appendChild(icon);
        slot.appendChild(text);
        spellSlots.appendChild(slot);
    });
}

function updateSpellTracker(completedIndex) {
    const slot = document.getElementById(`spell-slot-${completedIndex}`);
    if (slot) {
        slot.className = 'spell-slot completed';
        slot.querySelector('.spell-slot-icon').textContent = '✅';
        slot.querySelector('.spell-slot-text').textContent = 
            `${SPELLS[completedIndex].number}² = ${SPELLS[completedIndex].expectedOutput}`;
    }

    // Mark next as active
    const nextSlot = document.getElementById(`spell-slot-${completedIndex + 1}`);
    if (nextSlot) {
        nextSlot.className = 'spell-slot active';
    }
}

// ============================================================
// GRIMOIRE (Code Editor)
// ============================================================
function openGrimoire() {
    if (currentSpellIndex >= SPELLS.length) return;

    const spell = SPELLS[currentSpellIndex];
    spellTaskText.textContent = spell.task;
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
async function castSpell() {
    if (!pyodideReady) {
        outputText.textContent = "⏳ Python is still loading... please wait.";
        outputText.className = 'error';
        return;
    }

    const code = codeInput.value.trim();
    if (!code) {
        outputText.textContent = "✏️ Write your spell first!";
        outputText.className = 'error';
        return;
    }

    outputText.textContent = "🔮 Casting spell...";
    outputText.className = '';

    // Run the Python code via Pyodide
    const result = await evaluatePython(code);
    const spell = SPELLS[currentSpellIndex];

    if (result === spell.expectedOutput) {
        // SUCCESS!
        outputText.textContent = `✨ Output: ${result}\n🔥 CORRECT! Light increases by ${spell.lightGain}%!`;
        outputText.className = 'success';

        // Update trackers
        updateSpellTracker(currentSpellIndex);
        currentSpellIndex++;
        lightIntensity += spell.lightGain;

        // Update light visuals
        updateLightLevel();

        // Emit particles
        emitSpellParticles(40);

        // Close grimoire after a pause
        setTimeout(() => {
            closeGrimoire();

            // Check for completion
            if (currentSpellIndex >= SPELLS.length) {
                triggerVictory();
            } else {
                // Show prompt for next spell
                showSpellPrompt();
            }
        }, 1800);

    } else if (result.startsWith("Error:")) {
        outputText.textContent = `❌ Spell Failed!\n${result}`;
        outputText.className = 'error';
        shakeGrimoire();
    } else {
        outputText.textContent = `Output: ${result}\n❌ Expected: ${spell.expectedOutput}\n💡 Hint: ${spell.hint}`;
        outputText.className = 'error';
        shakeGrimoire();
    }
}

function showSpellPrompt() {
    dialogueBox.style.display = 'block';
    const spell = SPELLS[currentSpellIndex];
    typewriterText.innerHTML = '';
    isTyping = true;

    const msg = `Good! The darkness recedes... Next, square the number ${spell.number}. Click me to open the Grimoire!`;
    let charIdx = 0;

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

    setTimeout(() => {
        dialogueBox.style.display = 'none';
    }, 5000);
}

// ============================================================
// LIGHT LEVEL UPDATES
// ============================================================
function updateLightLevel() {
    const clamped = Math.min(lightIntensity, 100);

    // Update HUD bar
    lightBarFill.style.width = clamped + '%';
    lightPercent.textContent = clamped + '%';

    // Update darkness overlay opacity (inverse of light)
    const overlayOpacity = 1 - (clamped / 100);
    darknessOverlay.style.opacity = overlayOpacity;

    // Update cat brightness
    const catBrightness = 0.3 + (clamped / 100) * 0.7;
    catSprite.style.filter = `brightness(${catBrightness})`;

    // At certain thresholds, provide visual feedback
    if (clamped >= 40) {
        document.body.classList.add('torch-flicker');
    }

    // At 100%, switch to bright room
    if (clamped >= 100) {
        document.body.style.backgroundImage = "url('../assets/Level4/brightRoom.jpg')";
        darknessOverlay.style.opacity = 0;
        catSprite.style.filter = 'brightness(1)';
    }
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    setTimeout(() => {
        // Show stats
        successStats.innerHTML = 
            `SPELLS CAST: ${SPELLS.length}<br>` +
            `NUMBERS SQUARED: ${SPELLS.map(s => s.number).join(', ')}<br>` +
            `LIGHT RESTORED: 100%`;

        successScreen.classList.add('show');

        // Big particle burst
        emitSpellParticles(120);
    }, 1500);
}

// ============================================================
// GRIMOIRE SHAKE EFFECT
// ============================================================
function shakeGrimoire() {
    const container = document.getElementById('grimoire-container');
    container.style.animation = 'none';
    container.offsetHeight; // Trigger reflow
    container.style.animation = 'shake 0.4s ease';
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

// ============================================================
// LINE NUMBERS
// ============================================================
function updateLineNumbers() {
    const lines = codeInput.value.split('\n');
    let nums = '';
    for (let i = 1; i <= Math.max(lines.length, 8); i++) {
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
    for (let i = 0; i < count; i++) {
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
    const colors = [
        '255, 215, 0',    // Gold
        '255, 165, 0',    // Orange
        '139, 92, 246',   // Purple
        '251, 191, 36',   // Amber
        '74, 222, 128',   // Green
        '255, 255, 200',  // Warm white
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // slight gravity
        p.life -= p.decay;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = `rgba(${p.color}, ${p.life})`;
        particleCtx.fill();

        // Glow effect
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = `rgba(${p.color}, ${p.life * 0.15})`;
        particleCtx.fill();
    });

    // Ambient floating particles based on light level
    if (lightIntensity > 0 && Math.random() < lightIntensity / 200) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(Math.random() * 0.5 + 0.2),
            size: Math.random() * 2 + 0.5,
            life: 0.6,
            decay: 0.005,
            color: '255, 215, 0'
        });
    }

    requestAnimationFrame(animateParticles);
}
