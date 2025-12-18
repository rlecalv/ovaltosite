import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const team = [
  {
    name: "Coraline Paget-Domet",
    url: "https://www.linkedin.com/in/coraline-paget-domet-4027855a/",
    filename: "coraline.jpg"
  },
  {
    name: "Océane Neury",
    url: "https://www.linkedin.com/in/oc%C3%A9ane-neury-478137231/",
    filename: "oceane.jpg"
  },
  {
    name: "Mohamed Azroumbaze",
    url: "https://www.linkedin.com/in/mohamed-azroumbaze-5794769/",
    filename: "mohamed.jpg"
  },
  {
    name: "Matis Bot",
    url: "https://www.linkedin.com/in/matis-bot/",
    filename: "matis.jpg"
  },
  {
    name: "Sophie Alard",
    url: "https://www.linkedin.com/in/sophie-alard-51a57b56/",
    filename: "sophie.jpg"
  },
  {
    name: "Paul Pillet",
    url: "https://www.linkedin.com/in/paul-pillet-8324411b2/",
    filename: "paul.jpg"
  }
];

async function getProfilePictures() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outputDir = path.join(process.cwd(), 'public/images/team');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const member of team) {
    console.log(`Processing ${member.name}...`);
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
      await page.goto(member.url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Look for the profile image. LinkedIn often uses specific classes or data attributes
      // We try to find the largest image that looks like a profile picture
      const imageUrl = await page.evaluate(() => {
        // Try to find the meta image which is usually more reliable on public profiles
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && ogImage.content && !ogImage.content.includes('favicon')) return ogImage.content;

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage && twitterImage.content && !twitterImage.content.includes('favicon')) return twitterImage.content;

        // Common selectors for LinkedIn profile photos on public pages
        const selectors = [
          '.pv-top-card-profile-picture__image',
          '.top-card__profile-image',
          'img[alt*="profile"]',
          'img.EntityPhoto-circle-9',
          'img.profile-photo-edit__preview'
        ];

        for (const selector of selectors) {
          const img = document.querySelector(selector);
          if (img && img.src && !img.src.includes('data:') && !img.src.includes('favicon')) return img.src;
        }

        return null;
      });

      if (imageUrl) {
        console.log(`Found image for ${member.name}: ${imageUrl}`);
        const viewSource = await page.goto(imageUrl);
        fs.writeFileSync(path.join(outputDir, member.filename), await viewSource.buffer());
        console.log(`Saved ${member.filename}`);
      } else {
        console.log(`Could not find image for ${member.name}`);
      }
    } catch (error) {
      console.error(`Error processing ${member.name}:`, error.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

getProfilePictures();

