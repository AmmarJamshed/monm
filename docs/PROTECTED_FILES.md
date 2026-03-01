# Protected Files: Kill Switch & Screenshot Protection

## Two Ways to Share Files

### 1. Normal (default)

- **View** — Opens in-app viewer (protected)
- **Download** — Recipient gets raw file; can open in Excel, Adobe, etc. Screenshots possible outside app
- **Kill switch** — Works on blob URL; already-downloaded copies are outside our control

### 2. Secured Wrapper (checkbox when sending)

- **Open in secured viewer** — Recipient views via `/view/[mediaId]` — a standalone page with full ScreenshotGuard
- No raw download for recipient (sender who owns it can still download)
- Content always fetched from our API → **kill switch works from anywhere at any time**
- Works like "Excel in secured OneDrive" — same usability, no screenshots, kill switch always executable

**Kill switch works for both** — When activated, blob returns 410. Secured wrapper shows "Content disabled". Normal downloads: in-app view blocked; already-saved copies stay on disk (embedded macro can revoke if we implement protected .xlsm).

---

## Screenshot Protection (In-App & Secured Viewer)

- **View** opens PDF, images, videos, text in a secure viewer (blur when mouse leaves)
- **Secured wrapper** — Check "Secured" when attaching; recipient opens via link, no download
- ScreenshotGuard blocks: PrintScreen, Win+Shift+S, Alt+PrintScreen, Cmd+Shift+3/4/5, copy, right-click, drag
- Images and media are non-selectable and non-draggable

**Limitation:** "Embedded code" inside PDF, Excel, images, or videos **cannot prevent screenshots** when opened in native apps (Adobe, Excel, Photos). The only effective protection is **secured wrapper** or **in-app viewing**.

---

## Embedded Kill Switch

When someone downloads a file to their desktop and you later activate the kill switch, **the file itself can become unreadable** if it was distributed in "protected" format — containing embedded code that checks the blockchain/API before displaying content.

## How It Works

1. **Fingerprint**: Every uploaded file gets a SHA-256 fingerprint (content hash). This is stored in our DB and registered on-chain.

2. **Kill switch**: When you activate the kill switch via the "Kill shared file" flow:
   - DB: `kill_switch_active = 1` for that media
   - Blockchain: `KilledFingerprintRegistry.killFingerprint(fingerprint)` is called — immutable on-chain record

3. **Verification**: Any code (embedded macro, custom viewer) can check if a fingerprint is killed:
   - **API**: `GET /api/media/fingerprint/{hex64}/killed` → `{ killed: true|false }` (no auth)
   - **Blockchain**: Call `KilledFingerprintRegistry.isKilled(fingerprint)` (read-only, trustless)

4. **Embedded protection**: If the file was saved as macro-enabled (e.g. `.xlsm` for Excel), a macro runs when the file is opened. It reads the embedded fingerprint, calls the API or blockchain, and if killed, blocks content display.

## Excel VBA Macro Example

Add this to a workbook when creating a "protected" download. Store the fingerprint in a hidden sheet `_MonM`, cell A1.

```vba
' In ThisWorkbook module:
Private Sub Workbook_Open()
    Dim fp As String
    On Error Resume Next
    fp = ThisWorkbook.Sheets("_MonM").Range("A1").Value
    On Error GoTo 0
    If Len(fp) < 64 Then Exit Sub
    
    ' Check API (replace with your MonM backend URL)
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", "https://your-api.com/api/media/fingerprint/" & fp & "/killed", False
    http.setRequestHeader "Content-Type", "application/json"
    http.Send
    
    If http.Status = 200 Then
        Dim json As String
        json = http.responseText
        If InStr(json, """killed"":true") > 0 Or InStr(json, """killed"": true") > 0 Then
            MsgBox "Content disabled — leaked. Kill switch activated.", vbExclamation, "MonM"
            Application.Visible = False
            ThisWorkbook.Close SaveChanges:=False
            End
        End If
    End If
End Sub
```

## Implementation Notes

- **Standard .xlsx** cannot run macros. Protected format must be **.xlsm** (macro-enabled Excel).
- **First-time setup**: To create protected downloads automatically, the backend would need to:
  1. Convert uploaded `.xlsx` → `.xlsm`
  2. Add hidden sheet `_MonM` with fingerprint in A1
  3. Inject the VBA macro (requires e.g. Aspose.Cells, or SheetJS + vba.bin template)
- **Current flow**: Regular downloads serve the raw file. To get protected files, you would need to implement the conversion step or provide a "Save as protected" option that generates the .xlsm server-side.

## HTML Protected Download (Implemented)

For all file types (images, PDFs, documents), MonM now offers **"Download as protected"**:

1. **Flow**: User clicks "🔒 Download as protected" → backend returns an HTML file with:
   - Embedded fingerprint (SHA-256 hash)
   - File content as base64 (max 8MB)
   - JavaScript that fetches `GET /api/media/fingerprint/{hash}/killed` when the file is opened

2. **When opened**: The HTML runs in the browser. It checks the API (which mirrors the blockchain). If `killed: true`, it shows "Content disabled" and does not reveal the content. If not killed, it decodes and displays (images, PDF) or offers download (other types).

3. **Result**: Downloaded copies can be "killed" remotely. Even if someone saved the HTML file to their desktop months ago, opening it will check the current kill status and block display if the kill switch was activated.

## Blockchain Contract

`KilledFingerprintRegistry` (Polygon Amoy):

- `killFingerprint(bytes32 fingerprint)` — called by backend when kill switch is activated
- `isKilled(bytes32 fingerprint) view returns (bool)` — anyone can verify on-chain
- Events: `FingerprintKilled(fingerprint, killedBy, timestamp)` for indexing

Deploy: `cd contracts && npx hardhat run scripts/deploy.js --network amoy`
