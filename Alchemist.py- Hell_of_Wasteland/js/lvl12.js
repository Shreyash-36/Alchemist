/* ============================================================
   ALCHEMIST.PY — LEVEL 12: THE ENCHANTED LIBRARY
   (Wizard Shop — Uppercase Conversion)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Map text sets — pick a random one each playthrough
var MAP_SETS = [
    "follow the golden river north",
    "enter the cave behind the waterfall",
    "turn left at the ancient oak tree",
    "cross the bridge of fallen stones",
    "descend into the crystal cavern"
];

var setIdx = Math.floor(Math.random() * MAP_SETS.length);
var MAP_TEXT = MAP_SETS[setIdx];
var EXPECTED_UPPER = MAP_TEXT.toUpperCase();

// Dialogue system: each line has a speaker ("cat" or "wizard") and text
var DIALOGUE_SCRIPT = [
    { speaker: "cat",    text: "*sniff sniff* ...Do I smell FISH?! And is that... MILK?!" },
    { speaker: "cat",    text: "This must be some kind of magical shop! My stomach is GROWLING!" },
    { speaker: "wizard", text: "Welcome, little traveler! Yes, I sell the finest enchanted foods in the realm." },
    { speaker: "cat",    text: "Please sir, I'm starving! Can I have some of that grilled fish?!" },
    { speaker: "wizard", text: "Ha! Nothing is free in a wizard's shop, furry one. You'll need GOLD COINS." },
    { speaker: "cat",    text: "Gold coins?! I'm a CAT! Where would I even find gold coins?!" },
    { speaker: "wizard", text: "Hmm... I like your spirit. There's an ancient cave nearby, FILLED with gold." },
    { speaker: "wizard", text: "I'll give you a map to the cave. But there's a small... problem." },
    { speaker: "cat",    text: "A problem? What kind of problem?!" },
    { speaker: "wizard", text: "The map reads: \"" + MAP_TEXT + "\"" },
    { speaker: "cat",    text: "I... I can't read that! I'm a cat — I only understand UPPERCASE!" },
    { speaker: "wizard", text: "Then you'll need a spell to convert it! Use Python's magic, little one." },
    { speaker: "cat",    text: "Alright! I'll figure this out. Those gold coins are MINE!" },
    { speaker: "cat",    text: "Click on me to open the conversion spell..." }
];

// ============================================================
// STATE
// ============================================================
var dialogueIndex = 0;
var typingTimeout = null;
var isTyping = false;
var pyodideReady = false;
var particles = [];
var puzzleSolved = false;
var attemptsCount = 0;

// ============================================================
// DOM REFS
// ============================================================
var roomBg = document.getElementById('room-bg');
var mapHud = document.getElementById('map-hud');
var mapText = document.getElementById('map-text');
var mapExpected = document.getElementById('map-expected');
var catSprite = document.getElementById('the-cat-lvl12');
var dialogueBox = document.getElementById('dialogue-box');
var speakerLabel = document.getElementById('speaker-label');
var typewriterText = document.getElementById('typewriter-text-lvl12');
var wizardBubble = document.getElementById('wizard-bubble');
var wizardBubbleText = document.getElementById('wizard-bubble-text');
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

    // Set HUD text
    mapText.textContent = '"' + MAP_TEXT + '"';
    mapExpected.textContent = '???';

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

    // Continue button → save progress & go back to map
    btnContinue.addEventListener('click', function () {
        completeLevelCh2(12);
        showLevelLoadingCh2('lvl13.html', 'Loading Level 13...');
    });

    // Click dialogue to advance (only the cat dialogue box triggers advance)
    dialogueBox.addEventListener('click', advanceDialogue);
    wizardBubble.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add ambient glow to background
    roomBg.classList.add('shop-glow');
});



// ============================================================
// DIALOGUE (Dual speaker system)
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        // All dialogue done — hide both, show HUD
        dialogueBox.style.display = 'none';
        hideWizardBubble();
        mapHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;

    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "wizard") {
        // Show wizard bubble, hide cat dialogue box
        dialogueBox.style.display = 'none';
        showWizardBubble(line.text);
    } else {
        // Show cat dialogue box, hide wizard bubble
        hideWizardBubble();
        dialogueBox.style.display = 'block';
        speakerLabel.textContent = 'The Cat';
        typewriterText.innerHTML = '';
        typewriteCatDialogue(line.text);
    }
}

function typewriteCatDialogue(message) {
    var ci = 0;
    typewriterText.innerHTML = '';
    (function type() {
        if (ci < message.length) {
            typewriterText.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            addDialoguePrompt();
        }
    })();
}

function showWizardBubble(message) {
    wizardBubbleText.innerHTML = '';
    wizardBubble.classList.remove('visible', 'pop');
    // Force reflow for animation restart
    void wizardBubble.offsetWidth;
    wizardBubble.classList.add('visible', 'pop');

    var ci = 0;
    (function type() {
        if (ci < message.length) {
            wizardBubbleText.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            // Add a small click prompt in the bubble
            var prompt = document.createElement('div');
            prompt.style.cssText = 'margin-top:8px;color:#7c3aed;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
            prompt.textContent = '▼ CLICK TO CONTINUE ▼';
            wizardBubbleText.appendChild(prompt);
        }
    })();
}

function hideWizardBubble() {
    wizardBubble.classList.remove('visible', 'pop');
}

function addDialoguePrompt() {
    var prompt = document.createElement('div');
    prompt.className = 'click-prompt';
    prompt.textContent = '▼ CLICK TO CONTINUE ▼';
    typewriterText.appendChild(prompt);
}

function advanceDialogue() {
    if (isTyping) {
        // Skip typing — show full text immediately
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = DIALOGUE_SCRIPT[dialogueIndex];
        if (line.speaker === "wizard") {
            wizardBubbleText.textContent = line.text;
            var prompt = document.createElement('div');
            prompt.style.cssText = 'margin-top:8px;color:#7c3aed;text-align:center;font-size:5px;animation:prompt-blink 1s steps(1) infinite;';
            prompt.textContent = '▼ CLICK TO CONTINUE ▼';
            wizardBubbleText.appendChild(prompt);
        } else {
            typewriterText.textContent = line.text;
            addDialoguePrompt();
        }
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        dialogueBox.style.display = 'none';
        hideWizardBubble();
        mapHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Convert the map text "' + MAP_TEXT + '" to UPPERCASE and print the result.';
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();
    grimoireOverlay.classList.add('open');
    setTimeout(function () {
        codeInput.focus();
    }, 250);
}

function closeGrimoire() {
    grimoireOverlay.classList.remove('open');
}

function castSpell() {
    if (!pyodideReady) {
        outputText.textContent = 'Python is still loading...';
        outputText.className = 'error';
        return;
    }

    var code = codeInput.value.trim();
    if (!code) {
        outputText.textContent = 'Write some Python first.';
        outputText.className = 'error';
        return;
    }

    attemptsCount++;
    outputText.textContent = 'Casting the uppercase spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the text directly:\ntext = \"" + MAP_TEXT + "\"\nprint(text.upper())";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        if (trimmed === EXPECTED_UPPER) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! The cat can read the map now!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ Not quite!\nExpected:\n' + EXPECTED_UPPER + '\n\n💡 Hint: Use .upper() to convert a string to uppercase!';
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY SEQUENCE (dual dialogue)
// ============================================================
function triggerVictory() {
    // Update HUD to show the decoded text
    mapExpected.textContent = '"' + EXPECTED_UPPER + '"';
    mapExpected.style.color = '#4ade80';
    mapExpected.style.textShadow = '0 0 10px rgba(74, 222, 128, 0.6)';
    catSprite.style.filter = 'brightness(1)';

    emitParticles(50);

    // Victory dialogue: wizard congratulates, then cat celebrates
    showWizardBubble("Impressive! You decoded it! Now go, the cave awaits you!");

    setTimeout(function () {
        hideWizardBubble();
        dialogueBox.style.display = 'block';
        typewriterText.innerHTML = '';
        isTyping = true;
        var msg = "YES! I can read the map now! \"" + EXPECTED_UPPER + "\" — those gold coins are MINE! 🪙";
        var ci = 0;
        (function t() {
            if (ci < msg.length) {
                typewriterText.innerHTML += msg.charAt(ci++);
                setTimeout(t, 25);
            } else {
                isTyping = false;
            }
        })();

        // Show success screen after cat dialogue
        setTimeout(function () {
            dialogueBox.style.display = 'none';
            showSuccessScreen();
        }, 3500);
    }, 3000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'ORIGINAL: "' + MAP_TEXT + '"<br>' +
        'DECODED: "' + EXPECTED_UPPER + '"<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: MAP DECODED! 🪙';
    successScreen.classList.add('show');
    emitParticles(80);
}

// ============================================================
// EDITOR UTILITIES
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n').length;
    var count = Math.max(lines, 8);
    var numbers = '';
    for (var i = 1; i <= count; i++) {
        numbers += i + '\n';
    }
    lineNumbers.textContent = numbers;
}

function syncScroll() {
    lineNumbers.scrollTop = codeInput.scrollTop;
}

// ============================================================
// VISUAL EFFECTS
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function shakeGrimoire() {
    var container = document.getElementById('grimoire-container');
    container.classList.remove('shake');
    void container.offsetWidth;
    container.classList.add('shake');
}

function emitParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: particleCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 4 + 2),
            life: 1,
            decay: Math.random() * 0.015 + 0.005,
            size: Math.random() * 4 + 1,
            color: ['168,85,247', '192,132,252', '139,92,246', '124,58,237', '167,139,250', '255,215,0'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + p.life + ')';
        particleCtx.fill();

        // Glow
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }

    requestAnimationFrame(animateParticles);
}
