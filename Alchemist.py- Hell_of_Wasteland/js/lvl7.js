/* ALCHEMIST.PY — LEVEL 7: THE REVERSED ROOM */

var EXPECTED = "10\n9\n8\n7\n6\n5\n4\n3\n2\n1";

var DIALOGUE = [
    "Something is terribly wrong...",
    "A false spell has reversed everything in this room!",
    "The floor is the ceiling... the ceiling is the floor...",
    "To undo this chaos, we must counter the spell.",
    "Write a Python loop to print numbers from 10 down to 1.",
    "Use: for i in range(10, 0, -1): print(i)",
    "Click on me when you're ready to cast the reversal spell..."
];

var dialogueIdx = 0, isTyping = false, pyReady = false, solved = false, typingTimeout = null;
var particles = [];

// DOM
var roomBg = document.getElementById('room-bg');
var cat = document.getElementById('the-cat-lvl7');
var dBox = document.getElementById('dialogue-box');
var twText = document.getElementById('typewriter-text-lvl7');
var grimoire = document.getElementById('grimoire-overlay');
var taskText = document.getElementById('spell-task-text');
var codeIn = document.getElementById('code-input');
var lineNums = document.getElementById('line-numbers');
var outText = document.getElementById('output-text');
var chaosHud = document.getElementById('chaos-hud');
var chaosFill = document.getElementById('chaos-bar-fill');
var chaosText = document.getElementById('chaos-text');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var pCanvas = document.getElementById('spell-particles');
var pCtx = pCanvas.getContext('2d');

// Init
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initPython().then(function () { pyReady = true; }).catch(function (e) {
        console.error("Pyodide failed:", e);
    });

    // Cat starts flipped too
    cat.classList.add('flipped');

    setTimeout(function () {
        cat.style.display = 'block';
        dBox.style.display = 'block';
        showDialogue(0);
    }, 800);

    cat.addEventListener('click', openGrimoire);
    document.getElementById('grimoire-close').addEventListener('click', closeGrimoire);
    document.getElementById('btn-cast-spell').addEventListener('click', castSpell);
    document.getElementById('btn-clear').addEventListener('click', function () {
        codeIn.value = ''; outText.textContent = ''; outText.className = ''; updateLines();
    });
    document.getElementById('btn-continue').addEventListener('click', function () {
        showLevelLoading('lvl8.html', 'Loading Level 8...');
    });

    codeIn.addEventListener('input', updateLines);
    codeIn.addEventListener('scroll', function () { lineNums.scrollTop = codeIn.scrollTop; });
    updateLines();
    dBox.addEventListener('click', advanceDialogue);
    animateParticles();
});

// Dialogue
function showDialogue(idx) {
    if (idx >= DIALOGUE.length) {
        chaosHud.classList.add('visible');
        return;
    }
    dialogueIdx = idx; isTyping = true;
    twText.innerHTML = '';
    var text = DIALOGUE[idx], ci = 0;
    (function t() {
        if (ci < text.length) { twText.innerHTML += text.charAt(ci++); typingTimer = setTimeout(t, 35); }
        else { isTyping = false; addPrompt(); }
    })();
}

function addPrompt() {
    var p = document.createElement('div');
    p.className = 'click-prompt'; p.textContent = '▼ CLICK TO CONTINUE ▼';
    twText.appendChild(p);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimer); isTyping = false; twText.textContent = DIALOGUE[dialogueIdx]; addPrompt(); return;
    }
    dialogueIdx++;
    if (dialogueIdx < DIALOGUE.length) showDialogue(dialogueIdx);
    else { chaosHud.classList.add('visible'); dBox.style.display = 'none'; }
}

// Grimoire
function openGrimoire() {
    if (solved) return;
    taskText.textContent = "Write a for loop to print numbers from 10 down to 1 (each on a new line). Hint: use range(10, 0, -1)";
    codeIn.value = ''; outText.textContent = ''; outText.className = ''; updateLines();
    grimoire.classList.add('open');
    codeIn.focus();
}

function closeGrimoire() { grimoire.classList.remove('open'); }

// Cast spell
function castSpell() {
    if (!pyReady) { outText.textContent = "⏳ Python loading..."; outText.className = 'error'; return; }
    var code = codeIn.value.trim();
    if (!code) { outText.textContent = "✏️ Write your code first!"; outText.className = 'error'; return; }

    outText.textContent = "🔮 Casting reversal spell..."; outText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outText.textContent = "❌ input() doesn't work in browser!\n\n💡 Use a for loop:\nfor i in range(10, 0, -1):\n    print(i)";
            } else {
                outText.textContent = "❌ Spell Error!\n" + result;
            }
            outText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        if (trimmed === EXPECTED) {
            // SUCCESS!
            outText.textContent = "Output:\n" + trimmed + "\n\n✨ PERFECT! The reversal spell is working!";
            outText.className = 'success';
            solved = true;

            // Animate room flip back to normal
            setTimeout(function () {
                closeGrimoire();
                flipRoomBack();
            }, 1800);
        } else {
            // Check partial correctness
            var lines = trimmed.split('\n');
            var expectedLines = EXPECTED.split('\n');
            var correct = 0;
            for (var i = 0; i < Math.min(lines.length, expectedLines.length); i++) {
                if (lines[i].trim() === expectedLines[i]) correct++;
            }

            if (correct > 0 && correct < 10) {
                outText.textContent = "Output:\n" + trimmed + "\n\n⚠️ Partially correct (" + correct + "/10 numbers right).\nMake sure you print 10 down to 1, each on its own line.";
            } else {
                outText.textContent = "Output:\n" + trimmed + "\n\n❌ Not quite! Expected 10, 9, 8... down to 1.\n\n💡 Hint:\nfor i in range(10, 0, -1):\n    print(i)";
            }
            outText.className = 'error';
            shakeGrimoire();
        }
    });
}

// Flip room back to normal
function flipRoomBack() {
    emitParticles(60);

    // Animate chaos bar down
    chaosFill.style.width = '0%';
    chaosText.textContent = 'FIXING...';

    // Flip the room
    roomBg.classList.remove('flipped');
    roomBg.classList.add('fixed');

    // Unflip the cat
    cat.classList.remove('flipped');

    // Show dialogue about the fix
    dBox.style.display = 'block';
    twText.innerHTML = ''; isTyping = true;
    var msg = "The room is turning right-side up! The reversal spell worked!";
    var ci = 0;
    (function t() {
        if (ci < msg.length) { twText.innerHTML += msg.charAt(ci++); setTimeout(t, 25); }
        else { isTyping = false; }
    })();

    // More particles during the flip
    setTimeout(function () { emitParticles(40); }, 1000);
    setTimeout(function () { emitParticles(40); }, 2000);

    // Update chaos text
    setTimeout(function () { chaosText.textContent = 'FIXED!'; }, 2500);

    // Victory after the flip completes
    setTimeout(function () {
        dBox.style.display = 'none';
        triggerVictory();
    }, 4000);
}

function triggerVictory() {
    successStats.innerHTML =
        'SPELL CAST: Reversal Loop<br>' +
        'NUMBERS PRINTED: 10 → 1<br>' +
        'ROOM STATUS: RESTORED ✓';
    successScreen.classList.add('show');
    emitParticles(120);
}

// Shake
function shakeGrimoire() {
    var c = document.getElementById('grimoire-container');
    c.style.animation = 'none'; c.offsetHeight; c.style.animation = 'shake 0.4s ease';
}
var ss = document.createElement('style');
ss.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
document.head.appendChild(ss);

// Line numbers
function updateLines() {
    var n = Math.max(codeIn.value.split('\n').length, 8), s = '';
    for (var i = 1; i <= n; i++) s += i + '\n';
    lineNums.textContent = s;
}

// Particles
function resizeCanvas() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }

function emitParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * pCanvas.width, y: pCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3, vy: -(Math.random() * 4 + 2),
            size: Math.random() * 4 + 1, life: 1, decay: Math.random() * 0.015 + 0.005,
            color: ['155,89,182','192,132,252','107,33,168','139,92,246','74,222,128','255,215,0'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= p.decay;
        pCtx.beginPath(); pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = 'rgba(' + p.color + ',' + p.life + ')'; pCtx.fill();
        pCtx.beginPath(); pCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        pCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')'; pCtx.fill();
    }
    requestAnimationFrame(animateParticles);
}
