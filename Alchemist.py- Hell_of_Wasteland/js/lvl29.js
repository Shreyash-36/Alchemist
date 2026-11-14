/* ============================================================
   ALCHEMIST.PY — LEVEL 29: THE THREE LUCIFERS
   (Armstrong Number Verification — Identify the Real Lucifer)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Three Lucifer clones bear numbers: 245, 153, 312
// Armstrong number = sum of cubes of digits equals the number
//   245 → 2³+4³+5³ = 8+64+125 = 197 ≠ 245  ✗
//   153 → 1³+5³+3³ = 1+125+27 = 153         ✓ REAL LUCIFER
//   312 → 3³+1³+2³ = 27+1+8   = 36  ≠ 312   ✗
// Expected output: "153"

// Dialogue script — 3 speakers: cat, unicorn, lucifer
// Background changes to scene-two when Lucifer first speaks
var DIALOGUE_SCRIPT = [
    { speaker: "cat",     text: "We did it, Lumina! Lucifer's wards are shattered! He should be weakened from our last attacks!" },
    { speaker: "unicorn", text: "Look at him — he's staggering! His dark aura is flickering! One more strike and—" },
    { speaker: "lucifer", text: "FOOLS! You think you've won? I am the KING of Hell! I will NOT fall so easily!", bg: "scene-two" },
    { speaker: "cat",     text: "What?! He's still standing?! But the counter-spell should have—" },
    { speaker: "lucifer", text: "Your little spell cracked my wards, I'll admit. But you've merely ANGERED me! Now witness my TRUE power!" },
    { speaker: "unicorn", text: "No... what is he doing?! His body is splitting apart!" },
    { speaker: "lucifer", text: "HAHAHAHA! BEHOLD — THE TRINITY OF DARKNESS! Three of me now stand before you! Can you tell which is REAL?" },
    { speaker: "cat",     text: "He's duplicated himself into THREE clones! They all look identical!" },
    { speaker: "unicorn", text: "Wait — look! Each clone has a number branded on their chest! 245... 153... 312!" },
    { speaker: "cat",     text: "Those numbers must be the key! Lucifer's arrogance — he's left a mathematical signature on the real one!" },
    { speaker: "lucifer", text: "Go ahead, guess! But you only get ONE shot. Strike the wrong clone and I'll destroy you both!" },
    { speaker: "unicorn", text: "One shot?! We can't afford to miss! How do we figure out which is real?" },
    { speaker: "cat",     text: "Armstrong numbers! A number where the sum of the cubes of its digits equals the number itself!" },
    { speaker: "cat",     text: "Lucifer's true form always resonates with mathematical perfection. The clone bearing an Armstrong number is the REAL one!" },
    { speaker: "unicorn", text: "So we need to check each number — 245, 153, and 312 — and find which one is an Armstrong number?" },
    { speaker: "cat",     text: "Exactly! For a 3-digit number: split into digits, cube each one, sum them. If the sum equals the original number, that's our target!" },
    { speaker: "lucifer", text: "Tick tock, little cat. Make your choice... or I'll make it for you!" },
    { speaker: "cat",     text: "I need to verify this with code! Click on me to open the grimoire — we have ONE chance to get this right!" }
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
var battleHud     = document.getElementById('battle-hud');
var battleInfo    = document.getElementById('battle-info');
var battleStatus  = document.getElementById('battle-status');
var catSprite     = document.getElementById('the-cat-lvl29');
var unicornSprite = document.getElementById('the-unicorn-lvl29');
var catDialogue       = document.getElementById('dialogue-box-cat');
var catTypewriter     = document.getElementById('typewriter-text-cat');
var unicornDialogue   = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
var luciferDialogue   = document.getElementById('dialogue-box-lucifer');
var luciferTypewriter = document.getElementById('typewriter-text-lucifer');
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
var roomBg         = document.getElementById('room-bg');

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

    // Cat speaks first (celebrating from last attack)
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
        completeLevelCh3(29);
        showLevelLoadingCh3('lvl30.html', 'Loading Level 30...');
    });

    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);
    luciferDialogue.addEventListener('click', advanceDialogue);

    animateParticles();
});


// ============================================================
// DIALOGUE (Tri-speaker: Cat, Unicorn, Lucifer)
// ============================================================
function hideAllSpeakers() {
    catDialogue.style.display = 'none';
    unicornDialogue.style.display = 'none';
    luciferDialogue.style.display = 'none';
    catSprite.style.display = 'none';
    unicornSprite.style.display = 'none';
}

function showDialogue(index) {
    if (index >= DIALOGUE_SCRIPT.length) {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        battleHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;
    var line = DIALOGUE_SCRIPT[index];

    // Background transition
    if (line.bg === "scene-two") {
        roomBg.classList.add('scene-two');
    }

    if (line.speaker === "unicorn") {
        hideAllSpeakers();
        unicornSprite.style.display = 'block';
        unicornDialogue.style.display = 'block';
        unicornTypewriter.innerHTML = '';
        typewriteText(unicornTypewriter, line.text, 'unicorn');
    } else if (line.speaker === "lucifer") {
        hideAllSpeakers();
        // No sprite for Lucifer — he's in the background scene
        luciferDialogue.style.display = 'block';
        luciferTypewriter.innerHTML = '';
        typewriteText(luciferTypewriter, line.text, 'lucifer');
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
        var tw;
        if (line.speaker === "unicorn") tw = unicornTypewriter;
        else if (line.speaker === "lucifer") tw = luciferTypewriter;
        else tw = catTypewriter;
        tw.textContent = line.text;
        addPromptTo(tw, line.speaker);
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_SCRIPT.length) {
        showDialogue(dialogueIndex);
    } else {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        battleHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Lucifer has split into 3 clones with numbers: 245, 153, and 312. An Armstrong number is one where the sum of the cubes of its digits equals the number itself. Check each number and print ONLY the Armstrong number — that is the real Lucifer. (Hint: 1\u00b3+5\u00b3+3\u00b3 = 1+125+27 = ?)';
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
    outputText.textContent = 'Targeting the real Lucifer...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode the numbers:\nnumbers = [245, 153, 312]";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        // Accept "153" in any reasonable format
        if (trimmed === '153') {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\ud83c\udfaf DIRECT HIT! 153 is the real Lucifer — the spell strikes true!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else if (trimmed.indexOf('153') !== -1 && (trimmed.indexOf('245') !== -1 || trimmed.indexOf('312') !== -1)) {
            // They printed all numbers or extra info
            var hint = 'You found 153, but also printed other numbers!\n\n';
            hint += '\ud83d\udca1 Only print the Armstrong number:\n';
            hint += 'Check each number individually.\n';
            hint += 'Only print the one that IS Armstrong.\n';
            hint += 'Expected output: just "153"';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c Too many targets!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        } else if (trimmed === '245' || trimmed === '312') {
            var wrong = trimmed;
            var hint2 = 'That\'s a CLONE, not the real Lucifer!\n\n';
            hint2 += '\ud83d\udca1 Check your math:\n';
            if (wrong === '245') {
                hint2 += '245 → 2³+4³+5³ = 8+64+125 = 197 ≠ 245 ✗\n';
            } else {
                hint2 += '312 → 3³+1³+2³ = 27+1+8 = 36 ≠ 312 ✗\n';
            }
            hint2 += '\nThe REAL one: 153 → 1³+5³+3³ = 1+125+27 = 153 ✓';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c WRONG CLONE!\n' + hint2;
            outputText.className = 'error';
            shakeGrimoire();
        } else if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'armstrong' || trimmed.toLowerCase() === 'armstrong number') {
            var hint3 = 'You need to print the NUMBER itself, not a label!\n\n';
            hint3 += '\ud83d\udca1 Expected output: 153\n';
            hint3 += 'Print the actual Armstrong number\n';
            hint3 += 'so the spell knows WHERE to strike!';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c Print the number!\n' + hint3;
            outputText.className = 'error';
            shakeGrimoire();
        } else {
            var hint4 = 'Expected output: 153\n\n';
            hint4 += '\ud83d\udca1 Armstrong number check:\n';
            hint4 += 'For each num in [245, 153, 312]:\n';
            hint4 += '  Split digits → cube each → sum\n';
            hint4 += '  If sum == num → print(num)\n\n';
            hint4 += '153: 1³+5³+3³ = 1+125+27 = 153 ✓\n';
            hint4 += '245: 2³+4³+5³ = 8+64+125 = 197 ✗\n';
            hint4 += '312: 3³+1³+2³ = 27+1+8   = 36  ✗';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c Not quite!\n' + hint4;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    battleInfo.textContent = 'TARGET: 153 ✓ | LUCIFER: DESTROYED';
    battleInfo.style.color = '#4ade80';
    battleInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    battleStatus.textContent = '\u2713 DESTROYED!';
    battleStatus.classList.add('done');

    emitParticles(90);

    // Unicorn celebrates
    hideAllSpeakers();
    unicornSprite.style.display = 'block';
    unicornDialogue.style.display = 'block';
    unicornTypewriter.innerHTML = '';
    isTyping = true;
    var msg1 = "The spell hit the REAL one! Look — the other two clones are dissolving into shadows! Lucifer is falling! \ud83e\udd84\u2728";
    var ci1 = 0;
    (function t1() {
        if (ci1 < msg1.length) {
            unicornTypewriter.innerHTML += msg1.charAt(ci1++);
            setTimeout(t1, 25);
        } else { isTyping = false; }
    })();

    setTimeout(function () {
        hideAllSpeakers();
        // Lucifer's final words
        luciferDialogue.style.display = 'block';
        luciferTypewriter.innerHTML = '';
        var msg2 = "Im... impossible! How could a mere cat solve my... mathematical armour... I am... the KING...!";
        var ci2 = 0;
        (function t2() {
            if (ci2 < msg2.length) {
                luciferTypewriter.innerHTML += msg2.charAt(ci2++);
                setTimeout(t2, 30);
            }
        })();
    }, 3500);

    setTimeout(function () {
        hideAllSpeakers();
        catSprite.style.display = 'block';
        catDialogue.style.display = 'block';
        catTypewriter.innerHTML = '';
        var msg3 = "153 — the Armstrong number! His mathematical perfection was his downfall! The 2nd Crystal Fragment is ours! \u2694\ufe0f\ud83d\udc8e";
        var ci3 = 0;
        (function t3() {
            if (ci3 < msg3.length) {
                catTypewriter.innerHTML += msg3.charAt(ci3++);
                setTimeout(t3, 25);
            }
        })();
    }, 7000);

    setTimeout(function () {
        hideAllSpeakers();
        showSuccessScreen();
    }, 10500);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'CLONE 1: 245 → 2³+4³+5³ = 197 ≠ 245 ✗<br>' +
        'CLONE 2: 153 → 1³+5³+3³ = 153 = 153 ✓<br>' +
        'CLONE 3: 312 → 3³+1³+2³ = 36 ≠ 312 ✗<br>' +
        'REAL LUCIFER: 153 (ARMSTRONG NUMBER)<br>' +
        'HELL KING: DESTROYED 💀<br>' +
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
            color: ['239,68,68', '185,28,28', '245,158,11', '252,211,77', '74,222,128', '192,132,252'][Math.floor(Math.random() * 6)]
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
