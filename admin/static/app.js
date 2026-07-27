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
