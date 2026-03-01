# Excel Kill-Switch Template

The current `monm-template.xlsm` uses a blank `vbaProject.bin` — Excel files are served as .xlsm but the **kill switch does not run** when opened in Excel.

## To Enable Excel Kill Switch

You need a `vbaProject.bin` that contains the `Workbook_Open` macro from `Workbook_Open.vba`.

### Option 1: Create in Excel (recommended)

1. Open Excel and create a new workbook.
2. Press Alt+F11 to open the VBA editor.
3. Double-click **ThisWorkbook** in the Project Explorer.
4. Paste the contents of `Workbook_Open.vba` into the code window.
5. Save as **monm-macro.xlsm** (macro-enabled workbook).
6. Extract the vbaProject.bin:
   ```bash
   # Using xlsxwriter's vba_extract (if installed)
   vba_extract monm-macro.xlsm
   # Or: unzip the .xlsm, copy xl/vbaProject.bin
   ```
7. Replace `backend/templates/vbaProject.bin` with the extracted file.
8. Run: `node backend/scripts/create-template.js`

### Option 2: Use vbaProject-Compiler (when complete)

The [vbaProject-Compiler](https://github.com/Beakerboy/vbaProject-Compiler) can compile VBA to vbaProject.bin. The library is currently incomplete. When it supports `DocModule` and `OleFile`, run:

```bash
pip install git+https://github.com/Beakerboy/vbaProject-Compiler.git
# Then use the API to compile Workbook_Open.vba
```

## Current State

- **Images, PDF, text** (≤8MB): Kill switch works via HTML wrapper.
- **Excel**: Served as .xlsm; kill switch does **not** run until you add the macro to vbaProject.bin.
