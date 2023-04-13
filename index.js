const chromium = require('chrome-aws-lambda');
const fs = require('fs');
const express = require('express');
const path = require('path')
const app = express();
const port = 3000

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use('/files', express.static('files'))

app.get('/', (req, res) => {
    res.send('Hello')
})
app.post('/pdf-generator', async (req, res) => {
    // console.log(req.body)
    let { header, source, file_name } = req.body
    let type = 'url'
    let dir = 'files'
    let pdfUrl = `${req.protocol + '://' + req.headers.host}/${dir}/${file_name}`

    // Create a browser instance
    const browser = await chromium.puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
    })

    // Create a new page
    const page = await browser.newPage();

    if (type === 'url') {

        // Web site URL to export as pdf
        const website_url = source;

        // Open URL in current page
        await page.goto(website_url, { waitUntil: 'networkidle0' });

        // } else if (type === 'file') {

        //     //Get HTML content from HTML file
        //     const html = fs.readFileSync('template.html', 'utf-8');
        //     await page.setContent(html, { waitUntil: 'domcontentloaded' });

    } else {

        console.log(new Error(`HTML source "${type}" is unkown.`));
        await browser.close();
        return;
    }

    //To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');

    // Downlaod the PDF
    const pdf = await page.pdf({
        path: `${dir}/${file_name}`,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: header,
        footerTemplate: '<p></p>',
        margin: { top: '0', right: '0.5cm', bottom: '0', left: '0.5cm' },
        printBackground: true,
        format: 'A4',
    });

    // Close the browser instance
    await browser.close();
    res.send(pdfUrl)
});



app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
module.exports = app
