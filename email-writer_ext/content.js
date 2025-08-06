console.log("Email Writer Extension - Content Script Loaded");

function createToneSelector() {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '4px';

    const label = document.createElement('span');
    label.innerText = 'Tone:';
    label.style.fontSize = '11px';
    label.style.marginRight = '4px';
    label.style.userSelect = 'none';

    const select = document.createElement('select');
    select.className = 'ai-tone-select';
    select.style.fontSize = '12px';
    select.style.padding = '2px 6px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #ccc';
    select.style.zIndex = '10000'; // ensure dropdown floats above Gmail overlays
    select.title = 'Choose tone for AI reply';
    select.setAttribute('aria-label', 'Tone selector');

    // Prevent parent Gmail handlers from swallowing interaction
    ['click', 'mousedown', 'mouseup', 'focus', 'pointerdown'].forEach(evt => {
        select.addEventListener(evt, e => {
            e.stopPropagation();
        });
    });

    const options = [
        { value: 'friendly', text: 'Friendly' },
        { value: 'casual', text: 'Casual' },
        { value: 'professional', text: 'Professional' }
    ];
    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.innerText = o.text;
        select.appendChild(opt);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    return wrapper;
}

function createAIButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ai-reply-button T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.border = 'none';
    button.style.background = '#1a73e8';
    button.style.color = '#fff';
    button.style.padding = '6px 12px';
    button.style.fontSize = '13px';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    button.setAttribute('aria-label', 'Generate AI reply');

    const span = document.createElement('span');
    span.className = 'ai-reply-label';
    span.innerText = 'AI Reply';

    button.appendChild(span);
    return button;
}

function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    return '';
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;
}

function injectButton() {
    const existingContainer = document.querySelector('.ai-reply-container');
    if (existingContainer) existingContainer.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    const container = document.createElement('div');
    container.classList.add('ai-reply-container');
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.marginRight = '6px';
    container.style.pointerEvents = 'auto'; // ensure interactivity

    const toneSelector = createToneSelector();
    const button = createAIButton();

    button.addEventListener('click', async () => {
        try {
            const labelSpan = button.querySelector('.ai-reply-label');
            labelSpan.innerText = 'Thinking...';
            button.setAttribute('aria-busy', 'true');
            button.disabled = true;

            const emailContent = getEmailContent();
            const tone = toneSelector.querySelector('select').value;

            console.log(`Generating a "${tone}" reply for the email.`);

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: tone
                }),
            });

            if (!response.ok) {
                throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
            }

            const generatedReply = await response.text();

            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]') ||
                               document.querySelector('[aria-label="Message Body"]') ||
                               document.querySelector('div[contenteditable="true"]');

            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('Compose box was not found');
                alert('Oops! Could not find where to insert the reply.');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to generate reply: ' + error.message);
        } finally {
            const labelSpan = button.querySelector('.ai-reply-label');
            labelSpan.innerText = 'AI Reply';
            button.removeAttribute('aria-busy');
            button.disabled = false;
        }
    });

    container.appendChild(toneSelector);
    container.appendChild(button);

    if (toolbar.firstChild) {
        toolbar.insertBefore(container, toolbar.firstChild);
    } else {
        toolbar.appendChild(container);
    }
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') ||
             node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
