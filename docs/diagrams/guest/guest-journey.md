# Guest Journey

```mermaid
sequenceDiagram
    actor Guest
    participant Letter
    participant Website

    David & Danielle->>Guest: Send letter with QR code
    Guest->>Letter: Scan QR code
    Letter->>Website: Redirect to /invite/<guest-id>
    Website-->>Guest: Welcome screen
    Note over Guest,Website: See [Guest Visits Website from QR Code](qr-code-visit.md)
    Guest->>Website: Answer questions
    Website-->>David & Danielle: Response received
```
