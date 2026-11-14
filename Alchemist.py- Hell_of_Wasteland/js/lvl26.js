/* ============================================================
   ALCHEMIST.PY — LEVEL 26: THE VOLCANO RADIATION MAP
   (Nested Logic — Radiation Zone Classification)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Three volcanoes with coordinates and radiation strengths
// V1 = (2, 3), strength = 5
// V2 = (8, 3), strength = 4
// V3 = (5, 9), strength = 6
// 
// Point to test: (5, 1)
// Distance from V1: sqrt((5-2)^2 + (1-3)^2) = sqrt(9+4) = sqrt(13) ≈ 3.606
// Distance from V2: sqrt((5-8)^2 + (1-3)^2) = sqrt(9+4) = sqrt(13) ≈ 3.606
// Distance from V3: sqrt((5-5)^2 + (1-9)^2) = sqrt(0+64) = sqrt(64) = 8.0
//
// Radiation from V1 at point: 5 / 3.606 ≈ 1.387
// Radiation from V2 at point: 4 / 3.606 ≈ 1.109
// Radiation from V3 at point: 6 / 8.0 = 0.75
// Total radiation ≈ 3.246
//
// Zone classification (for the test point):
// If total_radiation < 1.5: "Safe Zone"
// If total_radiation >= 1.5 and total_radiation < 3.0: "Warning Zone"
// If within range of 2+ volcanoes (radiation from each > 0.8): "Interference Zone"
// If total_radiation >= 3.0: "Danger Zone"
//
// For (5,1): total ≈ 3.246, and radiation from V1 > 0.8, V2 > 0.8 → Interference Zone + Danger Zone
// Expected output: "Danger Zone" (highest priority)
//
// The SAFE point we want them to find: (5, 1) produces too much radiation.
// Let's find a genuinely safe point...
// Point (0, 0):
//   d1 = sqrt(4+9) = 3.606, rad1 = 5/3.606 = 1.387
//   d2 = sqrt(64+9) = 8.544, rad2 = 4/8.544 = 0.468
//   d3 = sqrt(25+81) = 10.296, rad3 = 6/10.296 = 0.583
//   total = 2.438 → Warning Zone
//
// Point (0, -5):
//   d1 = sqrt(4+64) = 8.246, rad1 = 5/8.246 = 0.606
//   d2 = sqrt(64+64) = 11.314, rad2 = 4/11.314 = 0.354
//   d3 = sqrt(25+196) = 14.866, rad3 = 6/14.866 = 0.404
//   total = 1.364 → Safe Zone! ✓
//
// Expected: For point (0, -5) → "Safe Zone"

// Dialogue script
var DIALOGUE_SCRIPT = [
    { speaker: "cat",     text: "We've crossed the River Styx, Lumina. Now we need to find Lucifer's castle. But... which direction do we go?" },
    { speaker: "unicorn", text: "I can sense something... dark energy emanating from three directions. Those are Hell Volcanoes!" },
    { speaker: "cat",     text: "Hell Volcanoes?! They sound terrifying! Are they dangerous?" },
    { speaker: "unicorn", text: "Extremely. Each volcano radiates cursed energy. The closer you get, the stronger the radiation burns through your soul." },
    { speaker: "unicorn", text: "But here's what I know — Lucifer's castle is located at the LEAST radiated position in all of Hell." },
    { speaker: "cat",     text: "That makes sense... even the Devil himself wouldn't want to be scorched by his own volcanoes!" },
    { speaker: "unicorn", text: "Exactly! The castle sits in the shadows, where the radiation from all three volcanoes is at its minimum." },
    { speaker: "cat",     text: "So we need to figure out the radiation zones! If we can classify any point as safe, warning, or danger..." },
    { speaker: "unicorn", text: "Right! The radiation from each volcano decreases with distance. The formula is: radiation = strength / distance." },
    { speaker: "unicorn", text: "The three volcanoes are at: V1=(2,3) with strength 5, V2=(8,3) with strength 4, V3=(5,9) with strength 6." },
    { speaker: "cat",     text: "And the total radiation at any point is the sum of radiation from all three volcanoes!" },
    { speaker: "unicorn", text: "Yes! Now we need to classify the zone for a given point using nested logic:" },
    { speaker: "unicorn", text: "If total radiation < 1.5 → Safe Zone. If between 1.5 and 3.0 → Warning Zone. If >= 3.0 → Danger Zone." },
    { speaker: "unicorn", text: "BUT — there's one more condition! If a point receives significant radiation (> 0.8) from 2 or more volcanoes, it's an Interference Zone." },
    { speaker: "cat",     text: "So we need NESTED if-else logic! Check the total first, but also check overlapping interference!" },
    { speaker: "unicorn", text: "Exactly! Write a function that takes a point (x, y) and returns the zone classification as a string." },
    { speaker: "cat",     text: "Test it with point (0, -5). I have a feeling that's where the safe corridor lies! Print the zone! Click on me to start!" }
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
var radHud = document.getElementById('rad-hud');
var radInfo = document.getElementById('rad-info');
var radStatus = document.getElementById('rad-status');
var catSprite = document.getElementById('the-cat-lvl26');
var unicornSprite = document.getElementById('the-unicorn-lvl26');
var catDialogue = document.getElementById('dialogue-box-cat');
var catTypewriter = document.getElementById('typewriter-text-cat');
var unicornDialogue = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
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

    initPython().then(function () {
        pyodideReady = true;
    }).catch(function (e) {
        console.error("Pyodide failed to load:", e);
    });

    // Cat speaks first
    setTimeout(function () {
        catSprite.style.display = 'block';
        showDialogue(0);
    }, 800);

    catSprite.addEventListener('click', openGrimoire);

    grimoireClose.addEventListener('click', closeGrimoire);
    btnCastSpell.addEventListener('click', castSpell);
    btnClear.addEventListener('click', function () {
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();
    });

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', syncScroll);
    updateLineNumbers();

    btnContinue.addEventListener('click', function () {
        completeLevelCh3(26);
        showLevelLoadingCh3('lvl27.html', 'Loading Level 27...');
    });

    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);

    animateParticles();
});


// ============================================================
// DIALOGUE (Dual-speaker: Cat & Unicorn)
// ============================================================
function hideAllSpeakers() {
    catDialogue.style.display = 'none';
    unicornDialogue.style.display = 'none';
    catSprite.style.display = 'none';
    unicornSprite.style.display = 'none';
}

function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        radHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;
    var line = DIALOGUE_SCRIPT[index];

    if (line.speaker === "unicorn") {
        hideAllSpeakers();
        unicornSprite.style.display = 'block';
        unicornDialogue.style.display = 'block';
        unicornTypewriter.innerHTML = '';
        typewriteText(unicornTypewriter, line.text, 'unicorn');
    } else {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        catDialogue.style.display = 'block';
        catTypewriter.innerHTML = '';
        typewriteText(catTypewriter, line.text, 'cat');
    }
}

function typewriteText(element, message, speaker) {
    var ci = 0;
    element.innerHTML = '';
    (function type() {
        if (ci < message.length) {
            element.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, 30);
        } else {
            isTyping = false;
            addPromptTo(element, speaker);
        }
    })();
}

function addPromptTo(element, speaker) {
    var prompt = document.createElement('div');
    prompt.className = 'click-prompt';
    prompt.textContent = '\u25bc CLICK TO CONTINUE \u25bc';
    element.appendChild(prompt);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = DIALOGUE_SCRIPT[dialogueIndex];
        if (line.speaker === "unicorn") {
            unicornTypewriter.textContent = line.text;
            addPromptTo(unicornTypewriter, 'unicorn');
        } else {
            catTypewriter.textContent = line.text;
            addPromptTo(catTypewriter, 'cat');
        }
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        radHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Given 3 volcanoes: V1=(2,3) str=5, V2=(8,3) str=4, V3=(5,9) str=6. Radiation at a point = strength / distance. Total = sum of all 3. Classify: total < 1.5 → "Safe Zone", 1.5-3.0 → "Warning Zone", >= 3.0 → "Danger Zone". If 2+ volcanoes have radiation > 0.8 at the point → "Interference Zone" (overrides Warning). Test point (0, -5). Print the zone!';
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();
    grimoireOverlay.classList.add('open');
    setTimeout(function () { codeInput.focus(); }, 250);
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
    outputText.textContent = 'Casting the spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode the data:\nvolcanoes = [(2,3,5), (8,3,4), (5,9,6)]";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim().toLowerCase();

        // The correct answer for point (0, -5) is "Safe Zone"
        if (trimmed.indexOf('safe zone') !== -1 || trimmed.indexOf('safe_zone') !== -1) {
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n☢️ CORRECT! The safe corridor has been identified!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else if (trimmed.indexOf('warning') !== -1 || trimmed.indexOf('danger') !== -1 || trimmed.indexOf('interference') !== -1) {
            var hint = 'Expected: "Safe Zone" for point (0, -5)\n\n';
            hint += 'Check your calculations:\n';
            hint += 'V1=(2,3) str=5: dist=sqrt((0-2)²+(-5-3)²)=sqrt(68)≈8.25\n';
            hint += '  rad1 = 5/8.25 ≈ 0.606\n';
            hint += 'V2=(8,3) str=4: dist=sqrt((0-8)²+(-5-3)²)=sqrt(128)≈11.31\n';
            hint += '  rad2 = 4/11.31 ≈ 0.354\n';
            hint += 'V3=(5,9) str=6: dist=sqrt((0-5)²+(-5-9)²)=sqrt(221)≈14.87\n';
            hint += '  rad3 = 6/14.87 ≈ 0.404\n';
            hint += 'Total ≈ 1.364 → < 1.5 → Safe Zone\n';
            hint += 'No volcano has rad > 0.8 → no interference';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\u274c Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        } else {
            var hint2 = 'Expected: "Safe Zone" for point (0, -5)\n\n';
            hint2 += '\ud83d\udca1 Steps:\n';
            hint2 += '1. Calculate distance: math.sqrt((x-vx)**2 + (y-vy)**2)\n';
            hint2 += '2. Radiation = strength / distance\n';
            hint2 += '3. Sum all 3 radiations for total\n';
            hint2 += '4. Use nested if-else to classify:\n';
            hint2 += '   - Check interference first (2+ with rad>0.8)\n';
            hint2 += '   - Then check total thresholds\n';
            hint2 += '5. Print the zone name as a string';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\u274c Not quite!\n' + hint2;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    radInfo.textContent = 'POINT (0,-5): SAFE ZONE ✓';
    radInfo.style.color = '#4ade80';
    radInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    radStatus.textContent = '\u2713 MAPPED!';
    radStatus.classList.add('done');

    emitParticles(70);

    // Unicorn celebrates
    hideAllSpeakers();
    unicornSprite.style.display = 'block';
    unicornDialogue.style.display = 'block';
    unicornTypewriter.innerHTML = '';
    isTyping = true;
    var msg1 = "Brilliant! The radiation map is complete! I can see the safe corridor now — it leads straight toward the castle! \ud83e\udd84\u2728";
    var ci1 = 0;
    (function t1() {
        if (ci1 < msg1.length) {
            unicornTypewriter.innerHTML += msg1.charAt(ci1++);
            setTimeout(t1, 25);
        } else { isTyping = false; }
    })();

    setTimeout(function () {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        catDialogue.style.display = 'block';
        catTypewriter.innerHTML = '';
        var msg2 = "The path is clear! Through the safe zone, avoiding the interference corridors. Lucifer's castle awaits! \u2694\ufe0f\ud83d\udd25";
        var ci2 = 0;
        (function t2() {
            if (ci2 < msg2.length) {
                catTypewriter.innerHTML += msg2.charAt(ci2++);
                setTimeout(t2, 25);
            }
        })();
    }, 3000);

    setTimeout(function () {
        hideAllSpeakers();
        showSuccessScreen();
    }, 6000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'VOLCANOES: V1(2,3)s=5, V2(8,3)s=4, V3(5,9)s=6<br>' +
        'TEST POINT: (0, -5)<br>' +
        'TOTAL RADIATION: ≈ 1.364<br>' +
        'CLASSIFICATION: SAFE ZONE ☢️<br>' +
        'INTERFERENCE: NONE ✓<br>' +
        'ATTEMPTS: ' + attemptsCount;
    successScreen.classList.add('show');
    emitParticles(80);
}

// ============================================================
// EDITOR
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n').length;
    var count = Math.max(lines, 8);
    var numbers = '';
    for (var i = 1; i <= count; i++) numbers += i + '\n';
    lineNumbers.textContent = numbers;
}

function syncScroll() { lineNumbers.scrollTop = codeInput.scrollTop; }

// ============================================================
// VISUAL EFFECTS
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function shakeGrimoire() {
    var c = document.getElementById('grimoire-container');
    c.classList.remove('shake');
    void c.offsetWidth;
    c.classList.add('shake');
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
            color: ['34,211,238', '239,68,68', '251,146,60', '165,243,252', '192,132,252', '74,222,128'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= p.decay;
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + p.life + ')';
        particleCtx.fill();
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }
    requestAnimationFrame(animateParticles);
}
