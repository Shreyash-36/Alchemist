/* ALCHEMIST.PY — LEVEL 9: THE FIBONACCI GRID */

// Fibonacci sequence (first 10 terms): 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
var FIBONACCI = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
var EXPECTED_OUTPUT = "0\n1\n1\n2\n3\n5\n8\n13\n21\n34";


var DIALOGUE = [
    "We've made it past the milk challenge! But what's this...",
    "A massive stone grid stretches across the floor!",
    "Each tile has a number carved into it.",
    "I can sense magic in some of these tiles...",
    "I need to jump on the tiles in the Fibonacci sequence!",
    "0, 1, 1, 2, 3, 5, 8... each number is the sum of the two before it.",
    "Write Python code to print the first 10 Fibonacci numbers.",
    "Click on me when you're ready to cast the sequence spell..."
];

var dialogueIdx = 0, isTyping = false, pyReady = false, solved = false, typingTimer = null;
var particles = [];
var attemptsCount = 0;

// DOM
var roomBg = document.getElementById('room-bg');
var cat = document.getElementById('the-cat-lvl9');
var dBox = document.getElementById('dialogue-box');
var twText = document.getElementById('typewriter-text-lvl9');
var grimoire = document.getElementById('grimoire-overlay');
var taskText = document.getElementById('spell-task-text');
var codeIn = document.getElementById('code-input');
var lineNums = document.getElementById('line-numbers');
var outText = document.getElementById('output-text');
var fibHud = document.getElementById('fib-hud');
var fibStep = document.getElementById('fib-step');
var fibBarFill = document.getElementById('fib-bar-fill');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var failScreen = document.getElementById('fail-screen');
var pCanvas = document.getElementById('spell-particles');
var pCtx = pCanvas.getContext('2d');


// Init
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    initPython().then(function () { pyReady = true; }).catch(function (e) {
        console.error("Pyodide failed:", e);
    });


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
        showLevelLoading('lvl10.html', 'Loading Level 10...');
    });
    document.getElementById('btn-retry').addEventListener('click', function () {
        showLevelLoading('lvl8.html', 'Returning to Level 8...');
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
        fibHud.classList.add('visible');
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
    else {
        fibHud.classList.add('visible');
        dBox.style.display = 'none';
    }
}

// Grimoire
function openGrimoire() {
    if (solved) return;
    taskText.textContent = "Print the first 10 terms of the Fibonacci sequence (each on a new line). The sequence starts: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34";
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

    attemptsCount++;
    outText.textContent = "🔮 Computing Fibonacci sequence..."; outText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outText.textContent = "❌ input() doesn't work in browser!\n\n💡 Use a loop:\na, b = 0, 1\nfor i in range(10):\n    print(a)\n    a, b = b, a + b";
            } else {
                outText.textContent = "❌ Spell Error!\n" + result;
            }
            outText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        if (trimmed === EXPECTED_OUTPUT) {
            // SUCCESS!
            outText.textContent = "Output:\n" + trimmed + "\n\n✨ PERFECT! The Fibonacci sequence lights the path!";
            outText.className = 'success';
            solved = true;

            setTimeout(function () {
                closeGrimoire();
                // Swap background to green immediately
                roomBg.style.opacity = '0';
                setTimeout(function () {
                    roomBg.style.background = "url('C:/Users/shrey/Desktop/Coders Space/ASEP GAME/assets/Level9/fibonacci green.jpeg') center/100% 100% no-repeat";
                    roomBg.style.opacity = '1';
                }, 400);
                // Update HUD to complete
                fibStep.textContent = '10';
                fibBarFill.style.width = '100%';
                emitParticles(40);
                // Go directly to victory
                setTimeout(function () {
                    triggerVictory();
                }, 800);
            }, 1200);
        } else {
            // Check partial correctness
            var lines = trimmed.split('\n');
            var expectedLines = EXPECTED_OUTPUT.split('\n');
            var correct = 0;
            var firstWrong = -1;

            for (var i = 0; i < Math.min(lines.length, expectedLines.length); i++) {
                if (lines[i].trim() === expectedLines[i]) {
                    correct++;
                } else if (firstWrong === -1) {
                    firstWrong = i;
                }
            }

            if (correct > 0 && correct < 10) {
                outText.textContent = "Output:\n" + trimmed + "\n\n⚠️ Partially correct (" + correct + "/10).\nExpected: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34\nEach on its own line.";
            } else {
                outText.textContent = "Output:\n" + trimmed + "\n\n❌ Wrong sequence!\nExpected: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34\n\n💡 Hint:\na, b = 0, 1\nfor i in range(10):\n    print(a)\n    a, b = b, a + b";
            }
            outText.className = 'error';
            shakeGrimoire();
        }
    });
}



function triggerVictory() {
    successStats.innerHTML =
        'FIBONACCI SEQUENCE: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34<br>' +
        'TILES CROSSED: 10 / 10<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: SAFE PASSAGE ✓';
    successScreen.classList.add('show');
    emitParticles(120);
}

function triggerFail() {
    // Swap background to red
    roomBg.style.opacity = '0';
    setTimeout(function () {
        roomBg.style.background = "url('../assets/Level9/fibonacci red.jpg') center/100% 100% no-repeat";
        roomBg.style.opacity = '1';
    }, 500);

    failScreen.classList.add('show');
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
            color: ['46,204,113','74,222,128','22,160,133','39,174,96','26,188,156','255,215,0'][Math.floor(Math.random() * 6)]
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
