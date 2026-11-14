/* ============================================================
   ALCHEMIST.PY — LEVEL 28: LUCIFER'S CASTLE
   (Hollow Diamond Pattern in Square Matrix — Nested Loops)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Task: Print a hollow diamond pattern inside a square matrix
// using alternating characters (* and #) for n = 5.
//
// Expected Output:
//   ##*##
//   #* *#
//   *   *
//   #* *#
//   ##*##
//
// Logic:
//   mid = n // 2
//   For each cell (i, j):
//     dist = abs(i - mid) + abs(j - mid)
//     if dist == mid  → print "*" (diamond border)
//     elif dist < mid → print " " (hollow inside)
//     else            → print "#" (outside fill)

// Dialogue script
var DIALOGUE_SCRIPT = [
    { speaker: "unicorn", text: "We've made it... Lucifer's Castle! Look at those towering dark spires... they're pulsing with infernal energy!" },
    { speaker: "cat",     text: "The 2nd Crystal Fragment is somewhere inside. I can feel its resonance... but there's something else too." },
    { speaker: "unicorn", text: "That presence... it's Lucifer himself! The Hell King is guarding the fragment personally!" },
    { speaker: "cat",     text: "Of course he is. He wouldn't leave something that powerful unprotected. We need a plan." },
    { speaker: "unicorn", text: "A plan? He's the KING of this realm! His power is beyond anything we've faced before!" },
    { speaker: "cat",     text: "Every king has a weakness, Lumina. Even Lucifer. His power comes from the dark geometric wards around the castle." },
    { speaker: "unicorn", text: "Geometric wards? You mean those strange patterns I saw etched into the castle walls?" },
    { speaker: "cat",     text: "Exactly! Those are hollow diamond formations — ancient defensive barriers. If we can replicate the pattern, we can break through his defences!" },
    { speaker: "unicorn", text: "So we fight magic with magic? Create the same pattern to neutralise his wards?" },
    { speaker: "cat",     text: "Yes! A hollow diamond inside a square matrix of alternating characters. It's a counter-spell that mirrors his own barrier!" },
    { speaker: "unicorn", text: "That's brilliant! But can you actually cast something that complex? The pattern has to be EXACT!" },
    { speaker: "cat",     text: "With nested loops and the right conditionals, I can generate the pattern. The diamond border uses '*', the outside uses '#', and the inside stays hollow!" },
    { speaker: "unicorn", text: "What dimension should the matrix be? Too small and it won't be powerful enough!" },
    { speaker: "cat",     text: "n = 5 should be perfect. A 5×5 matrix with the diamond at its centre — that's the resonance frequency of his wards!" },
    { speaker: "unicorn", text: "Then do it! Cast the counter-spell before Lucifer realises what we're doing!" },
    { speaker: "cat",     text: "Alright! I need to print the hollow diamond pattern. Click on me to open the grimoire and cast the counter-spell!" }
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
var castleHud     = document.getElementById('castle-hud');
var castleInfo    = document.getElementById('castle-info');
var castleStatus  = document.getElementById('castle-status');
var catSprite     = document.getElementById('the-cat-lvl28');
var unicornSprite = document.getElementById('the-unicorn-lvl28');
var catDialogue      = document.getElementById('dialogue-box-cat');
var catTypewriter    = document.getElementById('typewriter-text-cat');
var unicornDialogue  = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
var grimoireOverlay = document.getElementById('grimoire-overlay');
var grimoireClose   = document.getElementById('grimoire-close');
var spellTaskText   = document.getElementById('spell-task-text');
var codeInput   = document.getElementById('code-input');
var lineNumbers = document.getElementById('line-numbers');
var outputText  = document.getElementById('output-text');
var btnCastSpell = document.getElementById('btn-cast-spell');
var btnClear     = document.getElementById('btn-clear');
var successScreen = document.getElementById('success-screen');
var successStats  = document.getElementById('success-stats');
var btnContinue   = document.getElementById('btn-continue');
var particleCanvas = document.getElementById('spell-particles');
var particleCtx    = particleCanvas.getContext('2d');

// ============================================================
// EXPECTED OUTPUT
// ============================================================
var EXPECTED_OUTPUT =
    "##*##\n" +
    "#* *#\n" +
    "*   *\n" +
    "#* *#\n" +
    "##*##";

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

    // Unicorn speaks first (she sees the castle)
    setTimeout(function () {
        unicornSprite.style.display = 'block';
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
        completeLevelCh3(28);
        showLevelLoadingCh3('lvl29.html', 'Loading Level 29...');
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
        castleHud.classList.add('visible');
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
        castleHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Print a hollow diamond pattern inside a 5×5 square matrix. Use "*" for the diamond border, "#" for outside the diamond, and " " (space) for the hollow inside. Given n = 5, use nested loops with the Manhattan distance formula: dist = abs(i - mid) + abs(j - mid).';
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
    outputText.textContent = 'Casting the counter-spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode n = 5:\nn = 5";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();
        var expectedTrimmed = EXPECTED_OUTPUT.trim();

        // Normalise: collapse each line's trailing spaces
        var normalise = function (s) {
            return s.split('\n').map(function (line) {
                return line.replace(/\s+$/, '');
            }).join('\n');
        };

        var userNorm = normalise(trimmed);
        var expectNorm = normalise(expectedTrimmed);

        if (userNorm === expectNorm) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n⚔️ PERFECT! The diamond ward shatters Lucifer\'s defences!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            // Build helpful feedback
            var userLines = userNorm.split('\n');
            var expectLines = expectNorm.split('\n');
            var hint = '';

            if (userLines.length !== expectLines.length) {
                hint += 'Expected ' + expectLines.length + ' rows, got ' + userLines.length + '.\n';
                hint += 'Make sure n = 5 (5 rows).\n\n';
            } else {
                // Find first mismatched line
                for (var li = 0; li < expectLines.length; li++) {
                    if (userLines[li] !== expectLines[li]) {
                        hint += 'Row ' + (li + 1) + ' mismatch:\n';
                        hint += '  Yours:    "' + userLines[li] + '"\n';
                        hint += '  Expected: "' + expectLines[li] + '"\n\n';
                        break;
                    }
                }
            }

            hint += '\ud83d\udca1 Algorithm:\n';
            hint += 'mid = n // 2\n';
            hint += 'dist = abs(i-mid) + abs(j-mid)\n';
            hint += 'dist == mid → "*" (border)\n';
            hint += 'dist < mid  → " " (hollow)\n';
            hint += 'dist > mid  → "#" (outside)\n\n';
            hint += 'Expected output:\n';
            hint += '##*##\n#* *#\n*   *\n#* *#\n##*##';

            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    castleInfo.textContent = 'FRAGMENT: ACQUIRED ✓ | LUCIFER: DEFEATED';
    castleInfo.style.color = '#4ade80';
    castleInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    castleStatus.textContent = '\u2713 DEFEATED!';
    castleStatus.classList.add('done');

    emitParticles(80);

    // Unicorn celebrates
    hideAllSpeakers();
    unicornSprite.style.display = 'block';
    unicornDialogue.style.display = 'block';
    unicornTypewriter.innerHTML = '';
    isTyping = true;
    var msg1 = "The wards are crumbling! Lucifer's defences are breaking apart! The Crystal Fragment — I can see it glowing! \ud83e\udd84\u2728";
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
        var msg2 = "The counter-spell worked! Lucifer's geometric barriers have shattered! Grab the 2nd Crystal Fragment — we're one step closer to defeating the Alchemist! \u2694\ufe0f\ud83d\udc51";
        var ci2 = 0;
        (function t2() {
            if (ci2 < msg2.length) {
                catTypewriter.innerHTML += msg2.charAt(ci2++);
                setTimeout(t2, 25);
            }
        })();
    }, 3500);

    setTimeout(function () {
        hideAllSpeakers();
        showSuccessScreen();
    }, 7000);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'PATTERN: 5×5 HOLLOW DIAMOND ◇<br>' +
        'DIAMOND BORDER: * (Manhattan dist = mid)<br>' +
        'HOLLOW INSIDE: spaces (dist < mid)<br>' +
        'OUTSIDE FILL: # (dist > mid)<br>' +
        'LUCIFER: DEFEATED 👑<br>' +
        '2ND CRYSTAL FRAGMENT: CLAIMED 💎<br>' +
        'ATTEMPTS: ' + attemptsCount;
    successScreen.classList.add('show');
    emitParticles(100);
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
            color: ['168,85,247', '192,132,252', '233,213,255', '220,38,38', '74,222,128', '139,92,246'][Math.floor(Math.random() * 6)]
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
