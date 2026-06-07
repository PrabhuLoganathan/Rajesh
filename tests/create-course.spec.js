const { test, expect } = require('@playwright/test');

// Run tests in serial mode so that subsequent tests can build on top of the state of previous ones
test.describe.configure({ mode: 'serial' });

test.describe('Brightspace Course and Unit Creation Flow', () => {
  let page;
  let courseName;
  let courseCode;

  // Initialize a shared browser page context and unique course details
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const timestamp = Date.now();
    courseName = `testAutomation_${timestamp}`;
    courseCode = `code_${timestamp}`;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should log in and successfully create a new course', async () => {
    console.log(`Starting test for creating course: ${courseName}`);

    // 1. Navigate to the login page
    await page.goto('https://ansr.brightspacedemo.com/d2l/login?sessionExpired=0', {
      waitUntil: 'commit',
      timeout: 30000
    });

    // 2. Wait for login inputs and log in
    await page.waitForSelector('#userName', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000); // Allow time for event listeners to bind
    await page.fill('#userName', 'ansr.A1');
    await page.fill('#password', 'map6PYc!#S?3');
    await page.click('button:has-text("Log In")');

    // 3. Wait for login to complete by verifying that the URL is no longer the login page
    console.log('Waiting for login redirection...');
    await page.waitForURL(url => !url.href.includes('/login'));

    // 4. Navigate directly to the Courses page to save navigation time
    console.log('Navigating directly to the Courses page...');
    await page.goto('https://ansr.brightspacedemo.com/d2l/platformTools/courses/6606?coursesTab=1', {
      waitUntil: 'commit',
      timeout: 30000
    });

    // 5. Locate and click the "Create Course" button
    console.log('Waiting for Create Course button...');
    const createCourseBtn = page.locator('d2l-button:has-text("Create Course")');
    await createCourseBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createCourseBtn.click();

    // 6. Wait for the Create Course form fields to load
    console.log('Waiting for the course creation form...');
    const nameInput = page.locator('#course-name-input input');
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });

    // 7. Fill in the Course Name and Code
    console.log('Filling in course name and code...');
    await nameInput.fill(courseName);
    await page.locator('#course-code-input input').fill(courseCode);

    // 8. Select the Department
    console.log('Opening Choose Department dialog...');
    await page.locator('d2l-button-subtle:has-text("Choose Department")').click();

    const searchInput = page.locator('input[placeholder="Search for Department"]');
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });

    console.log('Searching for department "My Course"...');
    await searchInput.fill('My Course');
    await searchInput.press('Enter');

    const departmentOption = page.locator('d2l-selection-input[label="My Course"]');
    await departmentOption.waitFor({ state: 'visible', timeout: 15000 });
    await departmentOption.click();

    console.log('Confirming department selection...');
    await page.locator('d2l-button[data-dialog-action="done"]:has-text("Done")').click();

    await searchInput.waitFor({ state: 'hidden', timeout: 15000 });

    // 9. Save the Course
    console.log('Saving the new course...');
    await page.locator('d2l-button.buttons-in-the-bottom[name="save"]').click();

    // 10. Verify course creation was successful by searching the listing
    console.log('Verifying redirection back to Courses list...');
    await createCourseBtn.waitFor({ state: 'visible', timeout: 30000 });

    console.log(`Searching for the newly created course: ${courseName}...`);
    const listSearchInput = page.locator('input[placeholder="Search Courses"]');
    await listSearchInput.waitFor({ state: 'visible', timeout: 15000 });
    await listSearchInput.fill(courseName);
    await listSearchInput.press('Enter');

    console.log('Verifying course is visible in the search results...');
    const searchResultLink = page.locator(`a:has-text("${courseName}")`);
    await expect(searchResultLink).toBeVisible({ timeout: 15000 });

    console.log('Course successfully created and verified!');
  });

  test('should navigate to the created course via the dropdown menu', async () => {
    console.log(`Searching for the created course to navigate: ${courseName}...`);
    const listSearchInput = page.locator('input[placeholder="Search Courses"]');
    await listSearchInput.waitFor({ state: 'visible', timeout: 15000 });
    await listSearchInput.fill(courseName);
    await listSearchInput.press('Enter');
    await page.waitForTimeout(3000); // Wait for filtered list to settle

    // Click the dropdown arrow icon button in the course row
    console.log('Clicking the dropdown arrow next to the course name...');
    const dropdownBtn = page.locator(`tr:has-text("${courseName}") button[aria-label*="drop down"]`).first();
    await dropdownBtn.waitFor({ state: 'visible', timeout: 15000 });
    await dropdownBtn.click();

    // Click "View" option inside the dropdown menu list
    console.log('Selecting "View" from the dropdown menu...');
    const viewItem = page.locator('d2l-menu-item[text="View"]').first();
    await viewItem.waitFor({ state: 'visible', timeout: 15000 });
    await viewItem.click();

    // Wait for page redirection to the course home layout
    console.log('Waiting for the course landing page to load...');
    await page.waitForURL(url => url.href.includes('/content/') || url.href.includes('/lessons/'));
    console.log(`Redirection successful. Current URL: ${page.url()}`);
  });

  test('should create a new unit inside the course', async () => {
    // 1. Opt-in to the Lessons (New Content Experience) if landing on the Classic view
    const url = page.url();
    if (url.includes('/content/')) {
      const match = url.match(/\/(content|lessons)\/(\d+)/);
      const orgUnitId = match[2];
      console.log(`Landing in classic view (OrgUnitId: ${orgUnitId}). Opting in to Lessons...`);
      await page.evaluate((ou) => {
        const urlObj = D2L.LP.Web.Http.UrlLocation.Create(`/d2l/api/le/unstable/${ou}/content/useLessons?optIn=1`);
        D2L.LP.Web.UI.Rpc.Connect("POST", urlObj);
      }, orgUnitId);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(5000);
    }

    console.log('Locating smart-curriculum iframe...');
    const frame = page.frameLocator('iframe[src*="smart-curriculum"]');

    // Click "+ New Unit" button inside the curriculum frame
    console.log('Clicking "+ New Unit" button...');
    const newUnitBtn = frame.locator('d2l-button-subtle.new-unit-btn').first();
    await newUnitBtn.waitFor({ state: 'visible', timeout: 15000 });
    await newUnitBtn.click();

    // 2. Wait for Unit Form page to load and fill details
    console.log('Waiting for Unit Form page to load...');
    await page.waitForURL(url => url.href.includes('loadUnit'));
    
    const titleInput = page.locator('#content-title input');
    await titleInput.waitFor({ state: 'visible', timeout: 15000 });

    console.log('Filling in unit title...');
    const unitTitle = `testUnit_${Date.now()}`;
    await titleInput.fill(unitTitle);

    // 3. Save the Unit
    console.log('Saving the new Unit...');
    const saveBtn = page.locator('d2l-button.d2l-desktop[primary]');
    await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
    await saveBtn.click();

    // 4. Verify successful redirection indicating the unit has been saved
    console.log('Verifying unit creation and redirection...');
    await page.waitForURL(url => url.href.includes('/module/'));
    console.log(`Successfully created unit "${unitTitle}". Current URL: ${page.url()}`);
  });

  test('should click Add Existing and successfully upload documents of different formats', async () => {
    console.log('Locating smart-curriculum iframe for uploading documents...');
    const frame = page.frameLocator('iframe[src*="smart-curriculum"]');

    // 1. Locate and click the "Add Existing" button inside the iframe
    console.log('Clicking "Add Existing" button...');
    const addExistingBtn = frame.locator('d2l-button.add-existing-btn').first();
    await addExistingBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addExistingBtn.click();

    // 2. Wait for the hidden file uploader input element to be attached in the iframe
    console.log('Waiting for the file uploader input to be attached...');
    const fileInput = frame.locator('input.d2l-file-uploader-input');
    await fileInput.waitFor({ state: 'attached', timeout: 15000 });

    // 3. Set the file paths for the mock documents to upload
    const path = require('path');
    const fileDir = path.join(__dirname, '..', 'temp', 'upload_test_files');
    const filesToUpload = [
      path.join(fileDir, 'document.html'),
      path.join(fileDir, 'document.pdf'),
      path.join(fileDir, 'presentation.ppt'),
      path.join(fileDir, 'notes.txt')
    ];

    console.log(`Setting files for upload: ${JSON.stringify(filesToUpload)}`);
    await fileInput.setInputFiles(filesToUpload);

    // 4. Wait for the upload process to complete.
    console.log('Waiting for the uploaded documents to be processed...');
    await page.waitForTimeout(15000);

    // 5. Verify the files are successfully uploaded and appear in the sidebar/navigation tree.
    console.log('Verifying uploaded files in the sidebar/navigation tree...');
    const documentItem = frame.locator('.navigation-item', { hasText: 'document' }).first();
    const presentationItem = frame.locator('.navigation-item', { hasText: 'presentation' }).first();
    const notesItem = frame.locator('.navigation-item', { hasText: 'notes' }).first();
    
    await expect(documentItem).toBeVisible({ timeout: 15000 });
    await expect(presentationItem).toBeVisible({ timeout: 15000 });
    await expect(notesItem).toBeVisible({ timeout: 15000 });

    console.log('All documents successfully uploaded and verified!');

    // 6. Navigate back to the created course homepage
    const currentUrl = page.url();
    console.log(`Current URL before navigating back: ${currentUrl}`);
    const match = currentUrl.match(/\/(lessons|content)\/(\d+)/);
    if (match) {
      const orgUnitId = match[2];
      const courseHomeUrl = `https://ansr.brightspacedemo.com/d2l/le/lessons/${orgUnitId}`;
      console.log(`Navigating directly to course Lessons homepage: ${courseHomeUrl}`);
      await page.goto(courseHomeUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForURL(url => url.href.includes(`/lessons/${orgUnitId}`));
      console.log(`Successfully navigated back to course Lessons homepage. Current URL: ${page.url()}`);
    } else {
      throw new Error(`Could not extract orgUnitId from current URL: ${currentUrl}`);
    }
  });
});
