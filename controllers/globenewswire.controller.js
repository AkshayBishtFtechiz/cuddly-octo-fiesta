const GlobeNewsWireSchema = require("../Schema/GlobeNewsWireModel");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const moment = require("moment");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");

// GLOBE NEWS WIRE API

exports.getAllGlobeNewsWire = async (req, res) => {
  const { flag } = req.body;

  try {
    if (flag === true) {
      var law_firms = [];
      var getAllNewsFirm = await NewFirmsWireSchema.find()
      
      getAllNewsFirm?.forEach((response, index) => {
        law_firms.push(response.firmName);
      })
      var listed_firms = [...law_firms];
    }
    else {
      var law_firms = [
        "Berger%20Montague",
        "Bernstein%20Liebhard%20LLP",
        "Bronsteinδ%20Gewirtz%20&%20Grossmanδ%20LLC",
        "Faruqi%20&%20Faruqi%20LLP",
        //   "Grabar",
        "Hagens%20Berman%20Sobol%20Shapiro%20LLP",
        "Kessler%20Topaz%20Meltzer%20&%20Check%20LLP",
        "Pomerantz%20LLP",
        "Rigrodsky%20Lawδ%20P§A",
        "Schall%20Law",
        "Kaskela%20Law",
        "Glancy%20Prongay%20&%20Murray%20LLP",
        "Levi%20&%20Korsinskyδ%20LLP",
        "The%20Rosen%20Law%20Firm%20PA",
      ];
  
      var listed_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        // "Grabar",
        "Hagens Berman",
        "Kessler Topaz",
        "Pomerantz",
        "Rigrodsky",
        "Schall",
        "Kaskela",
        "Glancy",
        "Levi & Korsinsky",
        "Rosen",
      ];
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    const firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const encodedFirm = encodeURI(firm);
      const globeNewsWireUrl = `https://www.globenewswire.com/en/search/organization/${encodedFirm}?page=1`;
      await page.goto(globeNewsWireUrl, {
        waitUntil: "domcontentloaded",
        timeout: 300000,
      });
      // await page.waitForSelector(".pagging-list-item", { timeout: 300000 });
      await page.waitForSelector(".pagging-list-item");

      const htmlContent = await page.content();
      const $ = cheerio.load(htmlContent);

      const firmNewsItems = $(".pagging-list-item")
        .map((index, element) => {
          const $item = $(element);
          const title = $item.find('[data-autid="article-url"]').text();
          const date = $item
            .find('[data-autid="article-published-date"]')
            .text();
          const link = $item.find('[data-autid="article-url"]').attr("href");
          const summary = $item.find('[data-autid="article-summary"]').text();

          return {
            title,
            date,
            link,
            summary,
          };
        })
        .get(); // Convert to an array

      const filteredNewsItems = firmNewsItems.filter((item) => {
        return (
          item.summary.includes("(NASDAQ:") ||
          item.summary.includes("(NYSE:") ||
          item.summary.includes("(OTCBB:") ||
          item.title.includes("(NASDAQ:") ||
          item.title.includes("(NYSE:") ||
          item.title.includes("(OTCBB:")
        );
      });

      const payload = filteredNewsItems
        .map((newsItem) => {
          const tickerMatch =
            newsItem.summary.match(/\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/) ||
            newsItem.title.match(/\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/);
          const tickerSymbolMatch = (
            tickerMatch ? tickerMatch[2].trim() : ""
          ).match(/([^;\s]+)/);
          const formattedDate = moment(newsItem.date, [
            "MMM DD, YYYY",
            "MMM DD, YYYY h:mm A",
          ]).format("MMMM DD, YYYY");
          const id = uuidv4();

          // Check if tickerSymbol and tickerIssuer are not blank
          if (
            (tickerSymbolMatch &&
              tickerSymbolMatch[1] &&
              newsItem.summary.includes("(NASDAQ:")) ||
            newsItem.title.includes("(NASDAQ:")
          ) {
            return {
              scrapId: id,
              tickerSymbol: tickerSymbolMatch[1], // Extracted first ticker symbol
              firmIssuing: law_firms[i],
              serviceIssuedOn: "Globe News Wire", // Replace with actual service
              dateTimeIssued: formattedDate, // Use the current date and time
              urlToRelease: `https://www.globenewswire.com${newsItem.link}`,
              tickerIssuer: "NASDAQ",
            };
          } else if (
            (tickerSymbolMatch &&
              tickerSymbolMatch[1] &&
              newsItem.summary.includes("(NYSE:")) ||
            newsItem.title.includes("(NYSE:")
          ) {
            return {
              scrapId: id,
              tickerSymbol: tickerSymbolMatch[1], // Extracted first ticker symbol
              firmIssuing: law_firms[i],
              serviceIssuedOn: "Globe News Wire", // Replace with actual service
              dateTimeIssued: formattedDate, // Use the current date and time
              urlToRelease: `https://www.globenewswire.com${newsItem.link}`,
              tickerIssuer: "NYSE",
            };
          } else if (
            (tickerSymbolMatch &&
              tickerSymbolMatch[1] &&
              newsItem.summary.includes("(OTCBB:")) ||
            newsItem.title.includes("(OTCBB:")
          ) {
            return {
              scrapId: id,
              tickerSymbol: tickerSymbolMatch[1], // Extracted first ticker symbol
              firmIssuing: law_firms[i],
              serviceIssuedOn: "Globe News Wire", // Replace with actual service
              dateTimeIssued: formattedDate, // Use the current date and time
              urlToRelease: `https://www.globenewswire.com${newsItem.link}`,
              tickerIssuer: "OTCBB",
            };
          } else {
            // Handle the case where tickerSymbol or tickerIssuer is blank
            return null;
          }
        })
        .filter(Boolean); // Filter out null values

      // Save each document separately
      for (const newsData of payload) {
        firmData.push({ firm: listed_firms[i], payload: newsData });
      }
    }

    /* firmData.push({
      firm: "Berger Montague",
      payload: {
        tickerSymbol: "SERV",
        firmIssuing: "Berger Montague",
        serviceIssuedOn: "BusinessWire",
        dateTimeIssued: "January 02, 2024",
        urlToRelease:
          "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
        tickerIssuer: "NYSE",
      },
    });

    firmData.push({
      firm: "Rosen",
      payload: {
        tickerSymbol: "BIDU",
        firmIssuing: "Berger Montague",
        serviceIssuedOn: "BusinessWire",
        dateTimeIssued: "January 02, 2024",
        urlToRelease:
          "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
        tickerIssuer: "NYSE",
      },
    }); */

    // Search news details 75 days before the current date and remove before 75 days news deyails

    try {
      const { targetDate, formattedTargetDate } = filterDays(75);
      const last75DaysData = firmData.filter((newsDetails) => {
        const allPRNewsDate = moment(
          newsDetails?.payload.dateTimeIssued,
          "MMMM DD, YYYY"
        );
        return targetDate < allPRNewsDate;
      });
      const getAllGlobeNewsWire = await GlobeNewsWireSchema.find();
      emailSent(
        req,
        res,
        getAllGlobeNewsWire,
        last75DaysData,
        GlobeNewsWireSchema,
        flag
      );
      await browser.close();
    } catch (error) {
      console.error("Error:", error);
      {
        flag !== true && res.status(500).send("Internal Server Error");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    {
      flag !== true && res.status(500).send("Internal Server Error");
    }
  }
};

// Delete GlobeWireNews

exports.deleteGlobeNewsWireAll = async (req, res) => {
  GlobeNewsWireSchema.deleteMany({})
    .then((data) => {
      data === null
        ? res.send({
            message: "News already deleted",
          })
        : res.send({
            message: "News deleted successfully",
          });
    })
    .catch((err) => {
      res.send(err);
    });
};
