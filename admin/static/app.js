async function copyInviteList(button) {
    const originalLabel = button.textContent;

    try {
        const response = await fetch("/invitees/copy");
        if (!response.ok) throw new Error(`request failed with status ${response.status}`);

        const text = await response.text();
        await navigator.clipboard.writeText(text);
        button.textContent = "Copied!";
    } catch (err) {
        console.error("copyInviteList failed:", err);
        button.textContent = "Copy failed";
    } finally {
        setTimeout(() => {
            button.textContent = originalLabel;
        }, 2000);
    }
}

function initTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

    function activate(tab) {
        for (const t of tabs) {
            const selected = t === tab;
            t.setAttribute("aria-selected", String(selected));
            const panel = document.getElementById(t.getAttribute("aria-controls"));
            if (panel) panel.hidden = !selected;
        }
    }

    tablist.addEventListener("click", (event) => {
        const tab = event.target.closest('[role="tab"]');
        if (tab) activate(tab);
    });
}

document.addEventListener("DOMContentLoaded", initTabs);
