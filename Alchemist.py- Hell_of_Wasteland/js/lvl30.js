/* ============================================================
   ALCHEMIST.PY — LEVEL 30: THE DRAGON'S HEART
   (String Compression — The Betrayal Reveal)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Task: Basic string compression using counts of repeated characters
// "aabcccccaaa" → "a2b1c5a3"
//
// Algorithm:
//   Walk through string, count consecutive same chars
//   Append char + count to result

// Dialogue script — builds up to the BETRAYAL REVEAL
// After the puzzle is solved, the victory dialogue plays the twist
var DIALOGUE_SCRIPT = [
    { speaker: "cat",     text: "We're inside Lucifer's castle... the air is thick with dark magic. Stay close, Lumina." },
    { speaker: "unicorn", text: "Look at this chamber! It's enormous... and there — in the centre — a massive dragon statue!" },
    { speaker: "cat",     text: "That statue... it's ancient. Older than Lucifer himself. And look — embedded in its chest, right where the heart would be..." },
    { speaker: "unicorn", text: "The 2nd Crystal Fragment! It's glowing with an incredible energy! We've found it!" },
    { speaker: "cat",     text: "But it's sealed behind some kind of barrier. The dragon statue is protecting it with an ancient compression enchantment." },
    { speaker: "unicorn", text: "A compression enchantment? What does that mean?" },
    { speaker: "cat",     text: "The statue compresses the magical signatures around the fragment. To break through, I need to chant a compression spell — one that mirrors the enchantment!" },
    { speaker: "unicorn", text: "What kind of compression are we talking about?" },
    { speaker: "cat",     text: "String compression! The spell takes a sequence of characters and compresses them by counting consecutive repetitions." },
    { speaker: "cat",     text: "For example, 'aabcccccaaa' becomes 'a2b1c5a3' — each character followed by how many times it appears in a row!" },
    { speaker: "unicorn", text: "That's clever! So the dragon only responds to a properly compressed incantation?" },
    { speaker: "cat",     text: "Exactly! If I can compress the spell text correctly, the barrier will recognise the pattern and release the fragment!" },
    { speaker: "unicorn", text: "Then do it quickly! I can feel the castle's magic shifting... we don't have much time!" },
    { speaker: "cat",     text: "Right! Click on me to open the grimoire — I need to write the compression spell to unlock the dragon's heart!" }
];

// Post-victory betrayal dialogue (played after puzzle solved)
var BETRAYAL_SCRIPT = [
    { speaker: "cat",     text: "The barrier is dissolving! The dragon's eyes are dimming... the fragment is releasing!" },
    { speaker: "unicorn", text: "Grab it! Take the Crystal Fragment before the statue reforms!" },
    { speaker: "cat",     text: "I've got it! The 2nd Crystal Fragment — it's pulsing with incredible power! We did it, Lumina!" },
    { speaker: "unicorn-dark", text: "Hahahahaha... Yes... YES! Now the evil prevails the heavens!" },
    { speaker: "cat",     text: "What...? Lumina, what did you just say?" },
    { speaker: "unicorn-dark", text: "You heard me perfectly, little cat. 'Now the evil prevails the heavens.' Did you really think I was helping you out of kindness?" },
    { speaker: "cat",     text: "Who... who ARE you?! Your eyes — they're turning red! What's happening to you?!" },
    { speaker: "unicorn-dark", text: "All in due time, dear cat. All in due time... For now, hold onto that fragment tightly. You'll need it... for what comes next." }
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
var inBetrayalScene = false;
var betrayalIndex = 0;

// ============================================================
// DOM REFS
// ============================================================
var interiorHud    = document.getElementById('interior-hud');
var interiorInfo   = document.getElementById('interior-info');
var interiorStatus = document.getElementById('interior-status');
var catSprite     = document.getElementById('the-cat-lvl30');
var unicornSprite = document.getElementById('the-unicorn-lvl30');
var catDialogue       = document.getElementById('dialogue-box-cat');
var catTypewriter     = document.getElementById('typewriter-text-cat');
var unicornDialogue   = document.getElementById('dialogue-box-unicorn');
var unicornTypewriter = document.getElementById('typewriter-text-unicorn');
var unicornDarkDialogue   = document.getElementById('dialogue-box-unicorn-dark');
var unicornDarkTypewriter = document.getElementById('typewriter-text-unicorn-dark');
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

    // Cat speaks first (entering the castle)
    setTimeout(function () {
        catSprite.style.display = 'block';
        showDialogue(0);
    }, 800);

    catSprite.addEventListener('click', function () {
        if (!inBetrayalScene) openGrimoire();
    });

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
        completeLevelCh3(30);
        showLevelLoadingCh3('lvl31.html', 'Loading Level 31...');
    });

    catDialogue.addEventListener('click', advanceDialogue);
    unicornDialogue.addEventListener('click', advanceDialogue);
    unicornDarkDialogue.addEventListener('click', advanceDialogue);

    animateParticles();
});


// ============================================================
// DIALOGUE (Dual + Dark Reveal speaker system)
// ============================================================
function hideAllSpeakers() {
    catDialogue.style.display = 'none';
    unicornDialogue.style.display = 'none';
    unicornDarkDialogue.style.display = 'none';
    catSprite.style.display = 'none';
    unicornSprite.style.display = 'none';
}

function showDialogue(index) {
    var script = inBetrayalScene ? BETRAYAL_SCRIPT : DIALOGUE_SCRIPT;

    if (index >= script.length) {
        hideAllSpeakers();
        if (inBetrayalScene) {
            // After betrayal scene ends, show success
            showSuccessScreen();
        } else {
            catSprite.style.display = 'block';
            interiorHud.classList.add('visible');
        }
        return;
    }

    if (inBetrayalScene) {
        betrayalIndex = index;
    } else {
        dialogueIndex = index;
    }
    isTyping = true;
    var line = script[index];

    if (line.speaker === "unicorn") {
        hideAllSpeakers();
        unicornSprite.style.display = 'block';
        unicornDialogue.style.display = 'block';
        unicornTypewriter.innerHTML = '';
        typewriteText(unicornTypewriter, line.text, 'unicorn');
    } else if (line.speaker === "unicorn-dark") {
        hideAllSpeakers();
        unicornSprite.style.display = 'block';
        unicornDarkDialogue.style.display = 'block';
        unicornDarkTypewriter.innerHTML = '';
        // Darken the scene for dramatic effect
        roomBg.classList.add('darkened');
        typewriteText(unicornDarkTypewriter, line.text, 'unicorn-dark');
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
    var speed = (speaker === 'unicorn-dark') ? 40 : 30; // Slower for dramatic lines
    element.innerHTML = '';
    (function type() {
        if (ci < message.length) {
            element.innerHTML += message.charAt(ci);
            ci++;
            typingTimeout = setTimeout(type, speed);
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
    var script = inBetrayalScene ? BETRAYAL_SCRIPT : DIALOGUE_SCRIPT;
    var currentIdx = inBetrayalScene ? betrayalIndex : dialogueIndex;

    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        var line = script[currentIdx];
        var tw;
        if (line.speaker === "unicorn") tw = unicornTypewriter;
        else if (line.speaker === "unicorn-dark") tw = unicornDarkTypewriter;
        else tw = catTypewriter;
        tw.textContent = line.text;
        addPromptTo(tw, line.speaker);
        return;
    }

    var nextIdx = currentIdx + 1;
    if (inBetrayalScene) {
        betrayalIndex = nextIdx;
    } else {
        dialogueIndex = nextIdx;
    }

    if (nextIdx < script.length) {
        showDialogue(nextIdx);
    } else {
        hideAllSpeakers();
        if (inBetrayalScene) {
            showSuccessScreen();
        } else {
            catSprite.style.display = 'block';
            interiorHud.classList.add('visible');
        }
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Perform basic string compression using the counts of repeated characters. Given s = "aabcccccaaa", compress it so each character is followed by its consecutive count. For example: "a" appears 2 times, then "b" 1 time, then "c" 5 times, then "a" 3 times → "a2b1c5a3". Print the compressed string.';
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
    outputText.textContent = 'Chanting the compression spell...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode the string:\ns = \"aabcccccaaa\"";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        if (trimmed === 'a2b1c5a3') {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\ud83d\udc09 PERFECT! The dragon statue recognises the compression pattern!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else if (trimmed === 'a2b1c5a3 ' || trimmed === ' a2b1c5a3') {
            // Close but has extra spaces
            outputText.textContent = 'Output:\n"' + result + '"\n\n\u274c Almost! Remove trailing/leading spaces.\nExpected exactly: a2b1c5a3';
            outputText.className = 'error';
            shakeGrimoire();
        } else {
            var hint = 'Expected: a2b1c5a3\n\n';
            hint += '\ud83d\udca1 Walk through "aabcccccaaa":\n';
            hint += '  "aa"      → a appears 2× → "a2"\n';
            hint += '  "b"       → b appears 1× → "b1"\n';
            hint += '  "ccccc"   → c appears 5× → "c5"\n';
            hint += '  "aaa"     → a appears 3× → "a3"\n';
            hint += '  Result: "a2b1c5a3"\n\n';
            hint += 'Algorithm:\n';
            hint += '  Track current char + count\n';
            hint += '  When char changes, append to result\n';
            hint += '  Don\'t forget the last group!';
            outputText.textContent = 'Output:\n' + trimmed + '\n\n\u274c Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY (Triggers the Betrayal Scene)
// ============================================================
function triggerVictory() {
    interiorInfo.textContent = 'FRAGMENT: RELEASED ✓ | BARRIER: BROKEN';
    interiorInfo.style.color = '#4ade80';
    interiorInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    interiorStatus.textContent = '\u2713 UNLOCKED!';
    interiorStatus.classList.add('done');

    emitParticles(80);

    // Start the betrayal dialogue sequence
    inBetrayalScene = true;
    betrayalIndex = 0;

    setTimeout(function () {
        showDialogue(0);
    }, 800);
}

function showSuccessScreen() {
    // Update HUD to reflect the dark twist
    interiorInfo.textContent = 'FRAGMENT: CLAIMED | LUMINA: ???';
    interiorInfo.style.color = '#ef4444';
    interiorInfo.style.textShadow = '0 0 12px rgba(239,68,68,0.5)';
    interiorStatus.textContent = '\u26a0 BETRAYAL?!';
    interiorStatus.classList.remove('done');
    interiorStatus.classList.add('danger');

    successStats.innerHTML =
        'INPUT: "aabcccccaaa"<br>' +
        'COMPRESSED: "a2b1c5a3" ✓<br>' +
        'DRAGON BARRIER: BROKEN 🐉<br>' +
        '2ND CRYSTAL FRAGMENT: CLAIMED 💎<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        '<span style="color:#ef4444">LUMINA: "Now the evil prevails the heavens"</span><br>' +
        '<span style="color:#ef4444">THE CAT: "Who are you?!"</span>';
    successScreen.classList.add('show');
    emitParticles(60);
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
            color: ['109,40,217', '124,58,237', '167,139,250', '221,214,254', '192,132,252', '74,222,128'][Math.floor(Math.random() * 6)]
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
