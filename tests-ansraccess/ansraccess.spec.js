const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'serial' });

test.describe('ansrAccess Global + Dashboard Tests', () => {
  let page;
  let frame;

  test.beforeAll(async ({ browser }) => {
    // Shared page context to avoid repeated Canvas logins
    page = await browser.newPage();
    page.setDefaultTimeout(60000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should login to Canvas and navigate to ansrAccess Course Library', async () => {
    console.log('1. Navigating to Canvas login page...');
    await page.goto('https://ansrsource.beta.instructure.com/login/canvas', { waitUntil: 'load' });

    console.log('2. Submitting login credentials...');
    await page.fill('input[name="pseudonym_session[unique_id]"]', 'mohammed.isal@ansrsource.com');
    await page.fill('input[name="pseudonym_session[password]"]', 'ansr12345@!');
    await page.click('#login_form input[type="submit"]');

    console.log('3. Waiting for Canvas landing page redirection...');
    await page.waitForURL(/.*instructure\.com.*/);

    console.log('4. Locating and clicking LTI tool menu link...');
    const ltiLink = page.locator('a.ic-app-header__menu-list-link:has-text("ansrAccess Global +")');
    await expect(ltiLink).toBeVisible({ timeout: 30000 });
    await ltiLink.click();

    console.log('5. Waiting for LTI tool iframe...');
    const iframeSelector = 'iframe.tool_launch';
    await page.waitForSelector(iframeSelector, { state: 'attached', timeout: 30000 });
    
    // Resolve frame context
    frame = page.frameLocator(iframeSelector);
    console.log('Resolved LTI iframe locator.');

    console.log('6. Navigating to Course Library via sidebar panel...');
    const courseLibLink = frame.locator('.MuiListItemButton-root:has-text("Course Library"), [aria-label="Course Library"]').first();
    await expect(courseLibLink).toBeVisible({ timeout: 20000 });
    await courseLibLink.click();

    console.log('7. Waiting for Course Library unique description text and loaded table...');
    const descriptionText = frame.locator('text=Browse all your courses in one place').first();
    await expect(descriptionText).toBeVisible({ timeout: 20000 });

    const firstCourseRowButton = frame.locator('table tbody tr td button').first();
    await expect(firstCourseRowButton).toBeVisible({ timeout: 35000 });
    console.log('Successfully loaded Course Library page and course list!');
  });

  test('should successfully search for a course', async () => {
    console.log('1. Searching for "CS105" using the search input...');
    const searchInput = frame.locator('input[placeholder="Search"]');
    await searchInput.fill('CS105');
    await page.waitForTimeout(3000); // Allow results to filter

    console.log('2. Verifying search results...');
    const courseNames = await frame.locator('table tbody tr td:nth-child(2) button').allInnerTexts();
    console.log('Filtered course names:', courseNames);

    expect(courseNames.length).toBeGreaterThan(0);
    for (const name of courseNames) {
      expect(name.toLowerCase()).toContain('cs105');
    }

    console.log('3. Clearing search input...');
    await searchInput.fill('');
    await page.waitForTimeout(3000); // Settle rows
    
    const restoredCourseNames = await frame.locator('table tbody tr td:nth-child(2) button').allInnerTexts();
    expect(restoredCourseNames.length).toBeGreaterThan(courseNames.length);
    console.log('Search clear verified. Course list restored.');
  });

  test('should filter courses by score range', async () => {
    console.log('1. Opening Filters dropdown...');
    const filtersBtn = frame.locator('button:has-text("Filters")').first();
    await filtersBtn.click();
    await page.waitForTimeout(1500);

    console.log('2. Selecting "Poor" compliance score range filter...');
    const poorFilterOption = frame.locator('button[role="option"]').filter({ hasText: /^Poor$/ }).first();
    await poorFilterOption.click();
    await page.waitForTimeout(1000);

    console.log('3. Closing Filters dropdown...');
    await filtersBtn.click();
    await page.waitForTimeout(3000); // Wait for API response and rows updating

    console.log('4. Verifying compliance scores of filtered rows (should be < 70%)...');
    const scoreTexts = await frame.locator('table tbody tr td:nth-child(7)').allInnerTexts();
    console.log('Filtered scores:', scoreTexts);

    for (const scoreText of scoreTexts) {
      const match = scoreText.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        const score = parseFloat(match[1]);
        expect(score).toBeLessThan(70);
      }
    }

    console.log('5. Resetting Filters...');
    await filtersBtn.click();
    await page.waitForTimeout(1000);
    await poorFilterOption.click(); // Deselect "Poor"
    await filtersBtn.click();
    await page.waitForTimeout(3000);
  });

  test('should filter courses by sync status', async () => {
    console.log('1. Opening Filters dropdown...');
    const filtersBtn = frame.locator('button:has-text("Filters")').first();
    await filtersBtn.click();
    await page.waitForTimeout(1500);

    console.log('2. Selecting "Synced" status filter...');
    const syncedFilterOption = frame.locator('button[role="option"]').filter({ hasText: /^Synced$/ }).first();
    await syncedFilterOption.click();
    await page.waitForTimeout(1000);

    console.log('3. Closing Filters dropdown...');
    await filtersBtn.click();
    await page.waitForTimeout(3000); // Settle rows

    console.log('4. Verifying status column values (should all be "Synced")...');
    const statusTexts = await frame.locator('table tbody tr td:nth-child(8)').allInnerTexts();
    console.log('Filtered statuses:', statusTexts);

    for (const status of statusTexts) {
      const cleanedStatus = status.replace(/Status:\s*/i, '').trim().split('\n')[0].trim();
      expect(cleanedStatus).toBe('Synced');
    }

    console.log('5. Resetting Filters...');
    await filtersBtn.click();
    await page.waitForTimeout(1000);
    await syncedFilterOption.click(); // Deselect
    await filtersBtn.click();
    await page.waitForTimeout(3000);
  });

  test('should sort courses alphabetically by name', async () => {
    console.log('1. Opening Sort dropdown...');
    const sortBtn = frame.locator('button[aria-label*="Sort" i], button:has-text("Sort")').first();
    await sortBtn.click();
    await page.waitForTimeout(1500);

    console.log('2. Selecting "Course Name (A–Z)" sort option...');
    const alphabeticalSortOption = frame.locator('button[role="option"]:has-text("Course Name")').first();
    await alphabeticalSortOption.click();
    await page.waitForTimeout(1000);

    console.log('3. Closing Sort dropdown if open...');
    if (await frame.locator('[role="listbox"], [role="application"]').isVisible()) {
      await sortBtn.click();
    }
    await page.waitForTimeout(3000); // Settle rows

    console.log('4. Verifying rows are sorted alphabetically...');
    const courseNames = await frame.locator('table tbody tr td:nth-child(2) button').allInnerTexts();
    console.log('Sort alphabetically names:', courseNames);

    const sortedCopy = [...courseNames].sort((a, b) => a.localeCompare(b));
    expect(courseNames).toEqual(sortedCopy);

    // Reset sort
    await sortBtn.click();
    await page.waitForTimeout(1000);
    const clearAllBtn = frame.locator('button:has-text("Clear All")').first();
    if (await clearAllBtn.isEnabled()) {
      await clearAllBtn.click();
    }
    if (await frame.locator('[role="listbox"], [role="application"]').isVisible()) {
      await sortBtn.click();
    }
    await page.waitForTimeout(2000);
  });

  test('should sort courses by compliance score ascending', async () => {
    console.log('1. Opening Sort dropdown...');
    const sortBtn = frame.locator('button[aria-label*="Sort" i], button:has-text("Sort")').first();
    await sortBtn.click();
    await page.waitForTimeout(1500);

    console.log('2. Selecting "Score (Ascending)" sort option...');
    const scoreAscSortOption = frame.locator('button[role="option"]:has-text("Score (Ascending)")').first();
    await scoreAscSortOption.click();
    await page.waitForTimeout(1000);

    console.log('3. Closing Sort dropdown if open...');
    if (await frame.locator('[role="listbox"], [role="application"]').isVisible()) {
      await sortBtn.click();
    }
    await page.waitForTimeout(3000); // Settle rows

    console.log('4. Verifying rows are sorted by compliance score ascending...');
    const scoreTexts = await frame.locator('table tbody tr td:nth-child(7)').allInnerTexts();
    console.log('Sort score ascending scores:', scoreTexts);

    // Parse scores as numbers, extracting using regex to bypass responsive table headers,
    // and filtering out non-numeric values for sequential verification of parsed values.
    const numericScores = scoreTexts
      .map(s => {
        const match = s.match(/(\d+(?:\.\d+)?)\s*%/);
        return match ? parseFloat(match[1]) : null;
      })
      .filter(val => val !== null);

    console.log('Parsed numeric scores:', numericScores);
    for (let i = 0; i < numericScores.length - 1; i++) {
      expect(numericScores[i]).toBeLessThanOrEqual(numericScores[i + 1]);
    }
  });

  test('should navigate to the Course Details/Overview page', async () => {
    console.log('1. Searching for course "CS105" to ensure a course with score is used...');
    const searchInput = frame.locator('input[placeholder="Search"]');
    await searchInput.fill('CS105');
    await page.waitForTimeout(3000);

    console.log('2. Locating the course name button in the list...');
    const firstCourseButton = frame.locator('table tbody tr td:nth-child(2) button').first();
    const courseName = await firstCourseButton.innerText();
    console.log(`Clicking course name: ${courseName}`);
    await firstCourseButton.click();

    console.log('3. Waiting for Course Overview container page to render...');
    const courseOverviewHeader = frame.locator('text=Course Overview').first();
    await expect(courseOverviewHeader).toBeVisible({ timeout: 25000 });

    console.log('4. Verifying compliance score metric circle is visible...');
    const scoreMeter = frame.locator('text=Score').first();
    await expect(scoreMeter).toBeVisible({ timeout: 15000 });
    console.log('Navigation to Course Details page verified successfully!');
  });
});
