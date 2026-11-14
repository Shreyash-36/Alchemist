/* ============================================================
   ALCHEMIST.PY — LEVEL 27: THE LAVA CROSSING
   (Anagram Check — String Manipulation)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Task: Check if "flying" and "lying" are anagrams
// "flying" → f, l, y, i, n, g (6 letters)
// "lying"  → l, y, i, n, g (5 letters)
// Different lengths → NOT anagrams
// Expected output: "Not Anagrams"

// Dialogue script
var DIALOGUE_SCRIPT = [
    { speaker: "cat",     text: "Wait... Lumina, look! A massive pool of lava is blocking our path! There's no way around it!" },
    { speaker: "unicorn", text: "Oh no... the heat is unbearable! The lava stretches as far as I can see in both directions." },
    { speaker: "cat",     text: "Lumina, can't you use your wings to fly us across? You're a unicorn with wings after all!" },
    { speaker: "unicorn", text: "I... I can't. My wings were badly injured during the demon fight earlier. They're still healing." },
    { speaker: "cat",     text: "Oh no, I'm sorry Lumina... I didn't realise your wounds were that serious." },
    { speaker: "unicorn", text: "It's alright. But we need to find another way across. Do you know any spells that could help?" },
    { speaker: "cat",     text: "There is one spell I know — an ancient bridge-conjuring incantation. But... I can only use it ONCE." },
    { speaker: "unicorn", text: "Only once?! That's a powerful spell then. Are you sure you want to use it here?" },
    { speaker: "cat",     text: "I'm hesitant... what if we need it later? What if there's an even bigger obstacle ahead?" },
    { speaker: "unicorn", text: "I understand your worry. But think about it — if we don't cross now, we'll NEVER reach the castle!" },
    { speaker: "unicorn", text: "We need the Crystal Fragment to defeat the Alchemist. Without it, everything we've done is for nothing!" },
    { speaker: "cat",     text: "You're right, Lumina. The Crystal Fragment is more important than saving a spell for 'what if'." },
    { speaker: "unicorn", text: "Trust me on this! We'll find other ways to overcome future obstacles. Right now, THIS is our challenge!" },
    { speaker: "cat",     text: "Alright, I'll do it! But the spell requires a word-matching incantation to activate." },
    { speaker: "cat",     text: "I need to check if two ancient words are anagrams — words made of the same letters rearranged." },
    { speaker: "unicorn", text: "Anagrams? Like rearranging the letters of one word to form another?" },
    { speaker: "cat",     text: "Exactly! The spell tests with the words 'flying' and 'lying'. I need to determine if they're anagrams or not." },
    { speaker: "cat",     text: "If they ARE anagrams, print 'Anagrams'. If NOT, print 'Not Anagrams'. Click on me to cast the spell!" }
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
var lavaHud = document.getElementById('lava-hud');
var lavaInfo = document.getElementById('lava-info');
var lavaStatus = document.getElementById('lava-status');
var catSprite = document.getElementById('the-cat-lvl27');
var unicornSprite = document.getElementById('the-unicorn-lvl27');
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
        completeLevelCh3(27);
        showLevelLoadingCh3('lvl28.html', 'Loading Level 28...');
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
        lavaHud.classList.add('visible');
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
        lavaHud.classList.add('visible');
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Check if two strings are anagrams of each other. Two words are anagrams if they contain the exact same letters in the same quantities, just rearranged. Given str1 = "flying" and str2 = "lying", print "Anagrams" if they are anagrams, or "Not Anagrams" if they are not.';
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
                outputText.textContent = "\u274c input() doesn't work here!\n\n\ud83d\udca1 Hardcode the strings:\nstr1 = \"flying\"\nstr2 = \"lying\"";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim().toLowerCase();

        // The correct answer is "Not Anagrams" since "flying" (6 chars) and "lying" (5 chars)
        // have different lengths and different letter counts
        if (trimmed === 'not anagrams' || trimmed === 'not anagram') {
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n🌋 CORRECT! The spell recognises the truth — the bridge materializes!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else if (trimmed === 'anagrams' || trimmed === 'anagram') {
            var hint = 'Expected: "Not Anagrams"\n\n';
            hint += 'Check carefully:\n';
            hint += '"flying" → f, l, y, i, n, g (6 letters)\n';
            hint += '"lying"  → l, y, i, n, g (5 letters)\n\n';
            hint += 'They have DIFFERENT lengths!\n';
            hint += 'Anagrams must have the exact same letters\n';
            hint += 'in the same quantities.\n\n';
            hint += '\ud83d\udca1 Tip: Check len() first, then sorted()';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\u274c Not quite!\n' + hint;
            outputText.className = 'error';
            shakeGrimoire();
        } else if (trimmed === 'true' || trimmed === 'false') {
            var hint2 = 'Expected: "Not Anagrams" (as a string)\n\n';
            hint2 += '\ud83d\udca1 Print the exact words:\n';
            hint2 += 'print("Anagrams") or print("Not Anagrams")\n';
            hint2 += 'Not True/False!';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\u274c Close, but print the words!\n' + hint2;
            outputText.className = 'error';
            shakeGrimoire();
        } else {
            var hint3 = 'Expected: "Not Anagrams"\n\n';
            hint3 += '\ud83d\udca1 Steps to check anagrams:\n';
            hint3 += '1. Compare lengths first: len(str1) vs len(str2)\n';
            hint3 += '2. Sort both: sorted(str1) vs sorted(str2)\n';
            hint3 += '3. If same → "Anagrams", else → "Not Anagrams"\n\n';
            hint3 += '"flying" has 6 letters, "lying" has 5\n';
            hint3 += '→ Different lengths → Not Anagrams';
            outputText.textContent = 'Output:\n' + result.trim() + '\n\n\u274c Not quite!\n' + hint3;
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY
// ============================================================
function triggerVictory() {
    lavaInfo.textContent = 'BRIDGE: CONJURED ✓';
    lavaInfo.style.color = '#4ade80';
    lavaInfo.style.textShadow = '0 0 12px rgba(74,222,128,0.5)';
    lavaStatus.textContent = '\u2713 CROSSED!';
    lavaStatus.classList.add('done');

    emitParticles(70);

    // Unicorn celebrates
    hideAllSpeakers();
    unicornSprite.style.display = 'block';
    unicornDialogue.style.display = 'block';
    unicornTypewriter.innerHTML = '';
    isTyping = true;
    var msg1 = "You did it! The bridge is forming! Look — the lava is cooling into solid obsidian! We can cross! \ud83e\udd84\u2728";
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
        var msg2 = "The spell worked perfectly! One charge used, but it was worth it. Lucifer's castle is getting closer! \u2694\ufe0f\ud83d\udd25";
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
        'WORDS TESTED: "flying" vs "lying"<br>' +
        'FLYING: f, l, y, i, n, g (6 letters)<br>' +
        'LYING: l, y, i, n, g (5 letters)<br>' +
        'RESULT: NOT ANAGRAMS ✓<br>' +
        'SPELL CHARGES USED: 1/1 🔥<br>' +
        'BRIDGE: CONJURED 🌋<br>' +
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
            color: ['249,115,22', '239,68,68', '251,146,60', '254,215,170', '192,132,252', '74,222,128'][Math.floor(Math.random() * 6)]
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
