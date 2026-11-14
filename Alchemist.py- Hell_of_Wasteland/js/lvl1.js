// --- LEVEL 1 LOGIC ---
const levelData = {
    speaker: "THE CAT",
    text: [
        "Greetings, Apprentice.",
        "You have entered the Alchemist's Domain...",
        "To cross this line, you must first prove your wit.",
        "Click on the mirror, solve the riddle, and print the password."
    ],
    background: "../assets/level1/doorZoom.png",
    riddle: "I have whiskers and a tail. I am black from head to toe. I sit upon your porch, and say 'Meow'. What am I?"
};

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingMessage = document.getElementById('loading-message');
    const gameUI = document.getElementById('game-ui');
    const typewriterElement = document.getElementById("typewriter-text");
    const dialogueBox = document.querySelector('.dialogue-box');
    const theCat = document.getElementById('the-cat');

    // Grimoire elements
    const grimoireOverlay = document.getElementById('grimoire-overlay');
    const grimoireClose = document.getElementById('grimoire-close');
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    const outputText = document.getElementById('output-text');
    const spellTaskText = document.getElementById('spell-task-text');
    const btnCastSpell = document.getElementById('btn-cast-spell');
    const btnClear = document.getElementById('btn-clear');

    // ===== LINE NUMBERS =====
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n');
        const count = Math.max(lines.length, 8);
        let nums = '';
        for (let i = 1; i <= count; i++) {
            nums += i + '\n';
        }
        lineNumbers.textContent = nums;
    }

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });

    // Handle Tab key in textarea
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 4;
            updateLineNumbers();
        }
    });

    // Initialize line numbers
    updateLineNumbers();

    // ===== AUTO-INIT: Load Python and start level =====
    (async () => {
        loadingMessage.textContent = 'Transmuting lead into gold...';

        try {
            await initPython();
        } catch (err) {
            loadingMessage.textContent = 'Error loading Python engine. Please refresh.';
            console.error('Pyodide init failed:', err);
            return;
        }

        // Hide loading screen, show game UI
        loadingScreen.style.display = 'none';
        gameUI.style.display = 'block';

        // Set the level 1 background
        document.body.style.backgroundImage = `url('${levelData.background}')`;

        // Show the cat sprite
        theCat.style.display = 'block';

        // Show dialogue box and start the dialogue chain
        dialogueBox.style.display = 'block';
        chainDialogue(levelData.text, typewriterElement, 0, () => {
            // After all dialogue completes, activate the lock
            activateLock();
        });
    })();

    // ===== 2. DIALOGUE CHAIN =====
    function chainDialogue(lines, element, index, onComplete) {
        if (index >= lines.length) {
            if (onComplete) onComplete();
            return;
        }
        startTypewriter(lines[index], element, 40, () => {
            setTimeout(() => {
                chainDialogue(lines, element, index + 1, onComplete);
            }, 1200);
        });
    }

    // ===== 3. ACTIVATE LOCK HITBOX =====
    function activateLock() {
        const lockHitbox = document.createElement('div');
        lockHitbox.id = "lock-hitbox";
        lockHitbox.className = "hitbox-style";
        gameUI.appendChild(lockHitbox);

        lockHitbox.addEventListener('click', () => {
            openGrimoire();
            lockHitbox.style.display = 'none'; // hide hitbox once clicked
            dialogueBox.style.display = 'none'; // hide dialogue
        });
    }

    // ===== 4. OPEN GRIMOIRE =====
    function openGrimoire() {
        // Set the riddle text in the task area
        spellTaskText.textContent = levelData.riddle;

        // Show the grimoire overlay
        grimoireOverlay.classList.add('open');

        // Clear previous state
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();

        // Focus the code editor
        setTimeout(() => codeInput.focus(), 300);
    }

    // ===== 5. CLOSE GRIMOIRE =====
    grimoireClose.addEventListener('click', () => {
        grimoireOverlay.classList.remove('open');
        // Re-show the dialogue and hitbox
        dialogueBox.style.display = 'block';
        const hitbox = document.getElementById('lock-hitbox');
        if (hitbox) hitbox.style.display = 'block';
    });

    // ===== 6. RUN CODE BUTTON =====
    btnCastSpell.addEventListener('click', async () => {
        const userCode = codeInput.value.trim();
        if (!userCode) {
            outputText.textContent = 'Please write some code first!';
            outputText.className = 'error';
            return;
        }

        outputText.textContent = 'Executing Python...';
        outputText.className = '';

        // Run the user's Python code via Pyodide
        const output = await evaluatePython(userCode);

        // Check the output
        if (output === "cat") {
            outputText.textContent = '✓ Correct! The gate opens...';
            outputText.className = 'success';
            setTimeout(() => {
                showLevelLoading("lvl2.html", "Loading Level 2...");
            }, 1500);
        } else if (output.startsWith("Error:")) {
            outputText.textContent = output;
            outputText.className = 'error';
        } else {
            outputText.textContent = `Output was "${output}". Try again!`;
            outputText.className = '';
        }
    });

    // ===== 7. CLEAR BUTTON =====
    btnClear.addEventListener('click', () => {
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();
        codeInput.focus();
    });
});
