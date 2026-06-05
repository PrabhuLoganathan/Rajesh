const { test, expect } = require('@playwright/test');

test.describe('Brightspace Course Creation', () => {
  test('should log in and successfully create a new course', async ({ page }) => {
    // Generate unique course details to avoid naming conflicts on subsequent test runs
    const timestamp = Date.now();
    const courseName = `testAutomation_${timestamp}`;
    const courseCode = `code_${timestamp}`;

    console.log(`Starting test for creating course: ${courseName}`);

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
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });

    // 4. Navigate directly to the Courses page to save navigation time
    console.log('Navigating directly to the Courses page...');
    await page.goto('https://ansr.brightspacedemo.com/d2l/platformTools/courses/6606?coursesTab=1', {
      waitUntil: 'commit',
      timeout: 30000
    });

    // 5. Locate and click the "Create Course" button (web component)
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

    // Wait for the department search dialog to load
    const searchInput = page.locator('input[placeholder="Search for Department"]');
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });

    console.log('Searching for department "My Course"...');
    await searchInput.fill('My Course');
    await searchInput.press('Enter');

    // Wait for the search result matching "My Course" and select it
    console.log('Selecting "My Course" from results...');
    const departmentOption = page.locator('d2l-selection-input[label="My Course"]');
    await departmentOption.waitFor({ state: 'visible', timeout: 15000 });
    await departmentOption.click();

    // Click "Done" inside the dialog footer to confirm selection
    console.log('Confirming department selection...');
    await page.locator('d2l-button[data-dialog-action="done"]:has-text("Done")').click();

    // Wait for the dialog to close (the search input should no longer be visible)
    await searchInput.waitFor({ state: 'hidden', timeout: 15000 });

    // 9. Save the Course
    console.log('Saving the new course...');
    await page.locator('d2l-button.buttons-in-the-bottom[name="save"]').click();

    // 10. Verify course creation was successful
    // Upon clicking Save, we should be redirected back to the Courses list page
    console.log('Verifying redirection back to Courses list...');
    await createCourseBtn.waitFor({ state: 'visible', timeout: 30000 });

    // Search for the newly created course to verify it exists in the list
    console.log(`Searching for the newly created course: ${courseName}...`);
    const listSearchInput = page.locator('input[placeholder="Search Courses"]');
    await listSearchInput.waitFor({ state: 'visible', timeout: 15000 });
    await listSearchInput.fill(courseName);
    await listSearchInput.press('Enter');

    // Wait for the course list table/widget to refresh and display the course
    console.log('Verifying course is visible in the search results...');
    const searchResultLink = page.locator(`a:has-text("${courseName}")`);
    await expect(searchResultLink).toBeVisible({ timeout: 15000 });

    console.log('Course successfully created and verified!');
  });
});
