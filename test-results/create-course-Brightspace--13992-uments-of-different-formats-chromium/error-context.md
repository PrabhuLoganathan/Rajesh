# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-course.spec.js >> Brightspace Course and Unit Creation Flow >> should click Add Existing and successfully upload documents of different formats
- Location: tests/create-course.spec.js:180:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('iframe[src*="smart-curriculum"]').contentFrame().locator('.navigation-item').filter({ hasText: 'document' }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('iframe[src*="smart-curriculum"]').contentFrame().locator('.navigation-item').filter({ hasText: 'document' }).first()

```

```yaml
- heading "Course options" [level=2]
- button "New Unit":
  - img
  - text: New Unit
- button "Course options":
  - img
- searchbox "Search titles and descriptions"
- button "Search":
  - img
- application:
  - row "testUnit_1780802735424 Hidden from students Reorder item action for testUnit_1780802735424":
    - gridcell "testUnit_1780802735424 Hidden from students Reorder item action for testUnit_1780802735424":
      - link "testUnit_1780802735424 Hidden from students":
        - /url: /d2l/le/lessons/7124/units/13566
        - text: testUnit_1780802735424
        - img
      - button "Reorder item action for testUnit_1780802735424":
        - img
- switch:
  - img
  - img
- img
- text: Hidden
- button "Add Existing"
- button "Create New"
- button "Open in full screen mode":
  - img
- button "Options":
  - img
- button "Previous":
  - img
- img
- button "Next" [disabled]:
  - img
- heading "notes" [level=1]
- text: "This kind of file can't be opened in this viewer Download and view the file in another application instead. Text file File size: 104 Bytes"
- button "Download"
```

# Test source

```ts
  118 |     await dropdownBtn.waitFor({ state: 'visible', timeout: 15000 });
  119 |     await dropdownBtn.click();
  120 | 
  121 |     // Click "View" option inside the dropdown menu list
  122 |     console.log('Selecting "View" from the dropdown menu...');
  123 |     const viewItem = page.locator('d2l-menu-item[text="View"]').first();
  124 |     await viewItem.waitFor({ state: 'visible', timeout: 15000 });
  125 |     await viewItem.click();
  126 | 
  127 |     // Wait for page redirection to the course home layout
  128 |     console.log('Waiting for the course landing page to load...');
  129 |     await page.waitForURL(url => url.href.includes('/content/') || url.href.includes('/lessons/'));
  130 |     console.log(`Redirection successful. Current URL: ${page.url()}`);
  131 |   });
  132 | 
  133 |   test('should create a new unit inside the course', async () => {
  134 |     // 1. Opt-in to the Lessons (New Content Experience) if landing on the Classic view
  135 |     const url = page.url();
  136 |     if (url.includes('/content/')) {
  137 |       const match = url.match(/\/(content|lessons)\/(\d+)/);
  138 |       const orgUnitId = match[2];
  139 |       console.log(`Landing in classic view (OrgUnitId: ${orgUnitId}). Opting in to Lessons...`);
  140 |       await page.evaluate((ou) => {
  141 |         const urlObj = D2L.LP.Web.Http.UrlLocation.Create(`/d2l/api/le/unstable/${ou}/content/useLessons?optIn=1`);
  142 |         D2L.LP.Web.UI.Rpc.Connect("POST", urlObj);
  143 |       }, orgUnitId);
  144 |       await page.reload({ waitUntil: 'load' });
  145 |       await page.waitForTimeout(5000);
  146 |     }
  147 | 
  148 |     console.log('Locating smart-curriculum iframe...');
  149 |     const frame = page.frameLocator('iframe[src*="smart-curriculum"]');
  150 | 
  151 |     // Click "+ New Unit" button inside the curriculum frame
  152 |     console.log('Clicking "+ New Unit" button...');
  153 |     const newUnitBtn = frame.locator('d2l-button-subtle.new-unit-btn').first();
  154 |     await newUnitBtn.waitFor({ state: 'visible', timeout: 15000 });
  155 |     await newUnitBtn.click();
  156 | 
  157 |     // 2. Wait for Unit Form page to load and fill details
  158 |     console.log('Waiting for Unit Form page to load...');
  159 |     await page.waitForURL(url => url.href.includes('loadUnit'));
  160 |     
  161 |     const titleInput = page.locator('#content-title input');
  162 |     await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  163 | 
  164 |     console.log('Filling in unit title...');
  165 |     const unitTitle = `testUnit_${Date.now()}`;
  166 |     await titleInput.fill(unitTitle);
  167 | 
  168 |     // 3. Save the Unit
  169 |     console.log('Saving the new Unit...');
  170 |     const saveBtn = page.locator('d2l-button.d2l-desktop[primary]');
  171 |     await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
  172 |     await saveBtn.click();
  173 | 
  174 |     // 4. Verify successful redirection indicating the unit has been saved
  175 |     console.log('Verifying unit creation and redirection...');
  176 |     await page.waitForURL(url => url.href.includes('/module/'));
  177 |     console.log(`Successfully created unit "${unitTitle}". Current URL: ${page.url()}`);
  178 |   });
  179 | 
  180 |   test('should click Add Existing and successfully upload documents of different formats', async () => {
  181 |     console.log('Locating smart-curriculum iframe for uploading documents...');
  182 |     const frame = page.frameLocator('iframe[src*="smart-curriculum"]');
  183 | 
  184 |     // 1. Locate and click the "Add Existing" button inside the iframe
  185 |     console.log('Clicking "Add Existing" button...');
  186 |     const addExistingBtn = frame.locator('d2l-button.add-existing-btn').first();
  187 |     await addExistingBtn.waitFor({ state: 'visible', timeout: 15000 });
  188 |     await addExistingBtn.click();
  189 | 
  190 |     // 2. Wait for the hidden file uploader input element to be attached in the iframe
  191 |     console.log('Waiting for the file uploader input to be attached...');
  192 |     const fileInput = frame.locator('input.d2l-file-uploader-input');
  193 |     await fileInput.waitFor({ state: 'attached', timeout: 15000 });
  194 | 
  195 |     // 3. Set the file paths for the mock documents to upload
  196 |     const path = require('path');
  197 |     const fileDir = path.join(__dirname, '..', 'temp', 'upload_test_files');
  198 |     const filesToUpload = [
  199 |       path.join(fileDir, 'document.html'),
  200 |       path.join(fileDir, 'document.pdf'),
  201 |       path.join(fileDir, 'presentation.ppt'),
  202 |       path.join(fileDir, 'notes.txt')
  203 |     ];
  204 | 
  205 |     console.log(`Setting files for upload: ${JSON.stringify(filesToUpload)}`);
  206 |     await fileInput.setInputFiles(filesToUpload);
  207 | 
  208 |     // 4. Wait for the upload process to complete.
  209 |     console.log('Waiting for the uploaded documents to be processed...');
  210 |     await page.waitForTimeout(15000);
  211 | 
  212 |     // 5. Verify the files are successfully uploaded and appear in the sidebar/navigation tree.
  213 |     console.log('Verifying uploaded files in the sidebar/navigation tree...');
  214 |     const documentItem = frame.locator('.navigation-item', { hasText: 'document' }).first();
  215 |     const presentationItem = frame.locator('.navigation-item', { hasText: 'presentation' }).first();
  216 |     const notesItem = frame.locator('.navigation-item', { hasText: 'notes' }).first();
  217 |     
> 218 |     await expect(documentItem).toBeVisible({ timeout: 15000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  219 |     await expect(presentationItem).toBeVisible({ timeout: 15000 });
  220 |     await expect(notesItem).toBeVisible({ timeout: 15000 });
  221 | 
  222 |     console.log('All documents successfully uploaded and verified!');
  223 | 
  224 |     // 6. Navigate back to the created course homepage
  225 |     const currentUrl = page.url();
  226 |     console.log(`Current URL before navigating back: ${currentUrl}`);
  227 |     const match = currentUrl.match(/\/(lessons|content)\/(\d+)/);
  228 |     if (match) {
  229 |       const orgUnitId = match[2];
  230 |       const courseHomeUrl = `https://ansr.brightspacedemo.com/d2l/le/lessons/${orgUnitId}`;
  231 |       console.log(`Navigating directly to course Lessons homepage: ${courseHomeUrl}`);
  232 |       await page.goto(courseHomeUrl, { waitUntil: 'load', timeout: 30000 });
  233 |       await page.waitForURL(url => url.href.includes(`/lessons/${orgUnitId}`));
  234 |       console.log(`Successfully navigated back to course Lessons homepage. Current URL: ${page.url()}`);
  235 |     } else {
  236 |       throw new Error(`Could not extract orgUnitId from current URL: ${currentUrl}`);
  237 |     }
  238 |   });
  239 | });
  240 | 
```