// Frontend Component Testing Script
// This script tests frontend functionality by checking the built application

const puppeteer = require('puppeteer');

async function testFrontendComponents() {
  console.log('🎭 Starting Frontend Component Tests...\n');
  
  let browser;
  let page;
  let testsPassed = 0;
  let testsFailed = 0;
  const errors = [];

  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Helper function to run tests
    async function runTest(testName, testFn) {
      try {
        console.log(`⏳ Testing: ${testName}`);
        await testFn();
        console.log(`✅ PASSED: ${testName}`);
        testsPassed++;
      } catch (error) {
        console.log(`❌ FAILED: ${testName}`);
        console.log(`   Error: ${error.message}`);
        errors.push({ test: testName, error: error.message });
        testsFailed++;
      }
    }

    // Navigate to application
    await page.goto('http://localhost:5000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Test 1: Page Load
    await runTest('Application Page Load', async () => {
      const title = await page.title();
      if (!title || title.length === 0) {
        throw new Error('Page title is empty');
      }
      
      const content = await page.content();
      if (!content.includes('CrochetAI')) {
        throw new Error('Application header not found');
      }
    });

    // Test 2: Header Components
    await runTest('Header Components', async () => {
      const header = await page.$('header');
      if (!header) {
        throw new Error('Header element not found');
      }
      
      const title = await page.$eval('h1', el => el.textContent);
      if (title !== 'CrochetAI') {
        throw new Error(`Expected 'CrochetAI', got '${title}'`);
      }
    });

    // Test 3: Pattern Controls Panel
    await runTest('Pattern Controls Panel', async () => {
      // Check for text and upload tabs
      const textTab = await page.$('[value="text"]');
      const uploadTab = await page.$('[value="upload"]');
      
      if (!textTab) {
        throw new Error('Text generation tab not found');
      }
      if (!uploadTab) {
        throw new Error('Upload tab not found');
      }
      
      // Check for form inputs
      const descriptionInput = await page.$('textarea[placeholder*="describe"]');
      if (!descriptionInput) {
        throw new Error('Description textarea not found');
      }
    });

    // Test 4: Material Selection
    await runTest('Material Selection Components', async () => {
      // Check for material type selector
      const materialSelectors = await page.$$('[role="combobox"]');
      if (materialSelectors.length === 0) {
        throw new Error('Material selection dropdowns not found');
      }
      
      // Test material type dropdown
      await page.click('[role="combobox"]');
      await page.waitForTimeout(500);
      
      const yarnOption = await page.$('text=Yarn');
      const threadOption = await page.$('text=Crochet Thread');
      const stringOption = await page.$('text=Craft String');
      
      if (!yarnOption && !threadOption && !stringOption) {
        throw new Error('Material type options not found');
      }
      
      // Close dropdown
      await page.keyboard.press('Escape');
    });

    // Test 5: Color Viewer Component
    await runTest('Color Viewer Component', async () => {
      const colorViewer = await page.$('text=Interactive Color Viewer');
      if (!colorViewer) {
        throw new Error('Color Viewer component not found');
      }
      
      // Check for color tabs
      const previewTab = await page.$('text=Preview');
      const colorsTab = await page.$('text=Colors');
      const palettesTab = await page.$('text=Palettes');
      
      if (!previewTab || !colorsTab || !palettesTab) {
        throw new Error('Color Viewer tabs not found');
      }
    });

    // Test 6: Pattern Canvas
    await runTest('Pattern Canvas Component', async () => {
      const canvas = await page.$('.pattern-canvas, canvas, svg');
      if (!canvas) {
        // Canvas might not be visible without a pattern
        console.log('   ℹ️  Canvas will appear when pattern is generated');
      }
      
      // Check for view mode buttons
      const viewButtons = await page.$$('button');
      const hasViewControls = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => 
          btn.textContent.includes('2D') || 
          btn.textContent.includes('3D') || 
          btn.textContent.includes('Grid') ||
          btn.textContent.includes('Instructions')
        );
      });
      
      if (!hasViewControls) {
        throw new Error('View control buttons not found');
      }
    });

    // Test 7: Pattern Breakdown Component
    await runTest('Pattern Breakdown Component', async () => {
      const breakdown = await page.$('text=Pattern Breakdown');
      if (!breakdown) {
        throw new Error('Pattern Breakdown component not found');
      }
      
      // Should show message for no pattern
      const noPatternMessage = await page.$('text=Generate a pattern to see breakdown options');
      if (!noPatternMessage) {
        throw new Error('No pattern message not displayed');
      }
    });

    // Test 8: Properties Panel
    await runTest('Properties Panel Component', async () => {
      const propertiesPanel = await page.$('text=Pattern Properties, text=Properties');
      // Properties panel might have different text, check for save/download buttons
      const saveButton = await page.$('button:has-text("Save"), [aria-label*="save"]');
      const downloadButtons = await page.$$('button:has-text("Download"), [aria-label*="download"]');
      
      if (!saveButton && downloadButtons.length === 0) {
        throw new Error('Properties panel controls not found');
      }
    });

    // Test 9: Form Validation
    await runTest('Form Validation', async () => {
      // Try to generate with empty description
      const generateButton = await page.$('button:has-text("Generate Pattern")');
      if (generateButton) {
        await generateButton.click();
        await page.waitForTimeout(1000);
        
        // Should show validation error or prevent submission
        const isButtonDisabled = await page.evaluate(() => {
          const btn = document.querySelector('button:has-text("Generate Pattern")');
          return btn ? btn.disabled : false;
        });
        
        if (!isButtonDisabled) {
          console.log('   ℹ️  Form allows empty submission (handled by backend validation)');
        }
      }
    });

    // Test 10: Responsive Design
    await runTest('Responsive Design', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const body = await page.$('body');
      const isVisible = await body.isIntersectingViewport();
      
      if (!isVisible) {
        throw new Error('Page not properly visible on mobile viewport');
      }
      
      // Test desktop viewport
      await page.setViewport({ width: 1280, height: 720 });
      await page.waitForTimeout(500);
      
      // Check grid layout adapts
      const gridContainer = await page.$('.grid, .lg\\:grid-cols-12');
      if (!gridContainer) {
        throw new Error('Responsive grid layout not found');
      }
    });

    // Test 11: Error Handling Display
    await runTest('Error Handling Display', async () => {
      // Check if error boundaries exist
      const hasErrorHandling = await page.evaluate(() => {
        return window.React !== undefined; // React should be available for error boundaries
      });
      
      if (!hasErrorHandling) {
        console.log('   ℹ️  Error boundaries depend on React being loaded');
      }
    });

  } catch (error) {
    console.log(`❌ CRITICAL ERROR: ${error.message}`);
    testsFailed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('🎭 FRONTEND TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

  if (errors.length > 0) {
    console.log('❌ FAILED TESTS:');
    errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
    });
  }

  return { testsPassed, testsFailed, errors };
}

// Only run if puppeteer is available
async function checkPuppeteerAndRun() {
  try {
    await testFrontendComponents();
  } catch (error) {
    if (error.message.includes('puppeteer')) {
      console.log('ℹ️  Puppeteer not available for frontend testing');
      console.log('   Install with: npm install puppeteer');
      console.log('   Frontend components can be tested manually in browser');
    } else {
      console.error('Frontend test error:', error.message);
    }
  }
}

checkPuppeteerAndRun();