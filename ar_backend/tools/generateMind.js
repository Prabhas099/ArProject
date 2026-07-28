const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function compileTargets() {
  const imagePaths = process.argv.slice(2);
  if (imagePaths.length === 0) {
    console.log("No images provided for compilation.");
    process.exit(0);
  }

  console.log(`Starting compilation of ${imagePaths.length} target images...`);

  // Launch Google Chrome headlessly
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (process.platform === 'win32') {
    launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  const browser = await puppeteer.launch(launchOptions);


  try {
    const page = await browser.newPage();
    
    // Relay console logs from Chrome page to Node terminal
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });

    // Read local MindAR compiler bundle
    const scriptPath = path.join(__dirname, '..', '..', 'ar_frontend', 'node_modules', 'mind-ar', 'dist', 'mindar-image.prod.js');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`MindAR compiler script not found at: ${scriptPath}`);
    }
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Inject the compiler script into the browser context
    await page.evaluate(scriptContent);

    // Read and convert input images to Base64 data URLs
    const imagesBase64 = imagePaths.map(p => {
      const extension = path.extname(p).toLowerCase().replace('.', '');
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
      const content = fs.readFileSync(p);
      return `data:${mimeType};base64,${content.toString('base64')}`;
    });

    // Run the compiler inside the browser context
    const compiledData = await page.evaluate(async (base64Images) => {
      try {
        console.log("Loading target images into browser DOM...");
        const imgElements = [];
        for (let i = 0; i < base64Images.length; i++) {
          const img = new Image();
          const loaded = new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error(`Failed to load image at index ${i}`));
          });
          img.src = base64Images[i];
          await loaded;
          imgElements.push(img);
        }

        console.log("Instantiating MINDAR Compiler...");
        const compiler = new MINDAR.IMAGE.Compiler();

        console.log("Running compileImageTargets...");
        await compiler.compileImageTargets(imgElements, (progress) => {
          console.log(`Compilation progress: ${progress.toFixed(1)}%`);
        });

        console.log("Exporting compiled targets data...");
        const buffer = compiler.exportData();
        
        // Return as regular array of numbers to safely transfer across the Puppeteer boundary
        return { success: true, data: Array.from(buffer) };
      } catch (err) {
        console.error("Compilation error in browser:", err);
        return { success: false, error: err.message || err.toString() };
      }
    }, imagesBase64);

    if (!compiledData.success) {
      throw new Error(compiledData.error);
    }

    // Save output target file
    const outputFolder = path.join(__dirname, '..', 'media', 'targets_mind');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const outputPath = path.join(outputFolder, 'campaigns.mind');
    
    fs.writeFileSync(outputPath, Buffer.from(compiledData.data));
    console.log(`Successfully compiled and saved MindAR target file to: ${outputPath}`);

  } catch (error) {
    console.error("Headless compilation failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

compileTargets().catch(err => {
  console.error(err);
  process.exit(1);
});