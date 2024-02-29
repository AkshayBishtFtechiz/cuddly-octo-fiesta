require("dotenv").config();
const PRNewsWireSchema = require("../Schema/PRNewsWireModel");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");
const puppeteer = require("puppeteer");
const moment = require("moment");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");

// PR NEWS WIRE API

exports.getAllPRNewsWire = async (req, res) => {
  const { flag } = req.body;
 
  if (flag) {
    try {
      const law_firms = [];
      const getAllNewsFirm = await NewFirmsWireSchema.find()
      getAllNewsFirm?.forEach((response, index) => {
        law_firms.push(response.firmName);
      })

      const listed_firms = [...law_firms];
      
      const browser = await puppeteer.launch({
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--single-process",
          "--no-zygote",
        ],
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
      });

      const page = await browser.newPage();

      await page.setCacheEnabled(false);
  
      const firmData = [];
      const recentFirm = law_firms[law_firms.length - 1];
      
      for (let i = 0; i < law_firms.length; i++) {
      const firm = recentFirm;
        const encodedFirm = encodeURI(firm);
        const prNewsUrl = `https://www.prnewswire.com/search/?keyword=${encodedFirm}/`;
        await page.goto(prNewsUrl, {
          waitUntil: "domcontentloaded",
          timeout: 120000,
        });
  
        var newsItems = await page.$$eval(".card-list .newsCards .card .pull-left", (items) => {
          return items
            .map((item) => {
              const title = item
                .querySelector("h3 a").textContent.trim();
              const date = item.querySelector("h3 small")?.textContent.trim();
              const link = item.querySelector("a")?.getAttribute("href");
              const summary = item.querySelector("p")?.textContent.trim();
  
              return {
                title,
                date,
                link,
                summary,
              };
            })
        });

        const payload = newsItems
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
            // Check if tickerSymbol is not empty before adding to payload
            if (tickerSymbolMatch && tickerSymbolMatch[1]) {
              return {
                scrapId: id,
                tickerSymbol: tickerSymbolMatch[1], // Extracted first ticker symbol
                firmIssuing: law_firms[i],
                serviceIssuedOn: "PR Newswire", // Replace with actual service
                dateTimeIssued: formattedDate, // Use the current date and time
                urlToRelease: `https://www.prnewswire.com${newsItem.link}`,
                tickerIssuer:
                  newsItem.summary.includes("(NASDAQ:") ||
                  newsItem.title.includes("(NASDAQ:")
                    ? "NASDAQ"
                    : newsItem.summary.includes("(NYSE:") ||
                      newsItem.title.includes("(NYSE:")
                    ? "NYSE"
                    : newsItem.summary.includes("(OTCBB:") ||
                      newsItem.title.includes("(OTCBB:")
                    ? "OTCBB"
                    : "",
              };
            } else {
              return null; // Skip items with empty tickerSymbol
            }
          })
          .filter(Boolean); // Remove null entries
        
        for (const newsData of payload) {
          // const newNews = new PRNewsWireSchema(newsData);
          // await newNews.save();
          firmData.push({ firm: listed_firms[i], payload: newsData });
        }
      }
    
      try {
        const { targetDate, formattedTargetDate } = filterDays(75);
        const last75DaysData = firmData.filter((newsDetails) => {
          const allPRNewsDate = moment(
            newsDetails?.payload.dateTimeIssued,
            "MMMM DD, YYYY"
          );
          return targetDate < allPRNewsDate;
        });
        const getAllPRNewsWire = await PRNewsWireSchema.find();
        
        emailSent(req, res, getAllPRNewsWire, last75DaysData, PRNewsWireSchema, flag);
        await browser.close();
      } catch (error) {
        console.error("Error:", error);
        {
          flag !== true && (
            res.status(500).send("Internal Server Error"))
        }
      }
    }
    catch (error) {
      {
        flag !== true && (
          res.status(500).send("Internal Server Error"))
      }
    } 
  }
  else {
    try {
      const law_firms = [
        "berger-montague",
        "bernstein-liebhard-llp",
        "bronstein,-gewirtz-&-grossman,-llc",
        "faruqi-&-faruqi,-llp",
        "hagens-berman-sobol-shapiro-llp",
        "kessler-topaz-meltzer-&-check,-llp",
        "pomerantz-llp",
        "the-schall-law-firm",
        "kaskela-law-llc",
        "glancy-prongay-&-murray-llp",
        "levi-&-korsinsky,-llp",
        "the-rosen-law-firm,-p.-a.",
      ];
  
      const listed_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        "Hagens Berman",
        "Kessler Topaz",
        "Pomerantz",
        "Schall",
        "Kaskela",
        "Glancy",
        "Levi & Korsinsky",
        "Rosen",
      ];
  
      //req.body.firmName?.law_firms.push(req.body.firmName);
  
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
  
      const firmData = [];
  
      for (let i = 0; i < law_firms.length; i++) {
        const firm = law_firms[i];
        const encodedFirm = encodeURI(firm);
        const prNewsUrl = `https://www.prnewswire.com/news/${encodedFirm}/`;
        await page.goto(prNewsUrl, {
          waitUntil: "domcontentloaded",
          timeout: 120000,
        });
        await page.waitForSelector(".card-list .newsCards", { timeout: 120000 });
  
        var newsItems = await page.$$eval(".card-list .newsCards", (items) => {
          return items
            .map((item) => {
              const title = item
                .querySelector("h3 small")
                ?.nextSibling?.textContent.trim();
              const date = item.querySelector("h3 small")?.textContent.trim();
              const link = item.querySelector("a")?.getAttribute("href");
              const summary = item.querySelector("p")?.textContent.trim();
  
              return {
                title,
                date,
                link,
                summary,
              };
            })
            .filter((item) => {
              return (
                item.summary.includes("(NASDAQ:") ||
                item.summary.includes("(NYSE:") ||
                item.summary.includes("(OTCBB:") ||
                item.title.includes("(NASDAQ:") ||
                item.title.includes("(NYSE:") ||
                item.title.includes("(OTCBB:")
              );
            });
        });
  
        const payload = newsItems
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
            // Check if tickerSymbol is not empty before adding to payload
            if (tickerSymbolMatch && tickerSymbolMatch[1]) {
              return {
                scrapId: id,
                tickerSymbol: tickerSymbolMatch[1], // Extracted first ticker symbol
                firmIssuing: law_firms[i],
                serviceIssuedOn: "PR Newswire", // Replace with actual service
                dateTimeIssued: formattedDate, // Use the current date and time
                urlToRelease: `https://www.prnewswire.com${newsItem.link}`,
                tickerIssuer:
                  newsItem.summary.includes("(NASDAQ:") ||
                  newsItem.title.includes("(NASDAQ:")
                    ? "NASDAQ"
                    : newsItem.summary.includes("(NYSE:") ||
                      newsItem.title.includes("(NYSE:")
                    ? "NYSE"
                    : newsItem.summary.includes("(OTCBB:") ||
                      newsItem.title.includes("(OTCBB:")
                    ? "OTCBB"
                    : "",
              };
            } else {
              return null; // Skip items with empty tickerSymbol
            }
          })
          .filter(Boolean); // Remove null entries
  
        for (const newsData of payload) {
          // const newNews = new PRNewsWireSchema(newsData);
          // await newNews.save();
          firmData.push({ firm: listed_firms[i], payload: newsData });
        }
      }
  
      /* firmData.push({
        firm: "Berger Montague",
        payload: {
          scrapId: uuidv4(),
          tickerSymbol: "DADA",
          firmIssuing: "Berger Montague",
          serviceIssuedOn: "Flipkart",
          dateTimeIssued: "January 02, 2024",
          urlToRelease:
            "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
          tickerIssuer: "NYSE",
        },
      });
  
      firmData.push({
        firm: "Rosen",
        payload: {
          scrapId: uuidv4(),
          tickerSymbol: "DADA1212",
          firmIssuing: "Berger Montague",
          serviceIssuedOn: "Amazon",
          dateTimeIssued: "January 05, 2024",
          urlToRelease:
            "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
          tickerIssuer: "NYSE",
        },
      });
  
      firmData.push({
        firm: "Rosen",
        payload: {
          scrapId: uuidv4(),
          tickerSymbol: "DADA1313",
          firmIssuing: "Berger Montague",
          serviceIssuedOn: "Google",
          dateTimeIssued: "January 05, 2024",
          urlToRelease:
            "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
          tickerIssuer: "NYSE",
        },
      }); */
  
      // Search news details 75 days before the current date and remove before 75 days news details
  
      try {
        const { targetDate, formattedTargetDate } = filterDays(75);
        const last75DaysData = firmData.filter((newsDetails) => {
          const allPRNewsDate = moment(
            newsDetails?.payload.dateTimeIssued,
            "MMMM DD, YYYY"
          );
          return targetDate < allPRNewsDate;
        });
        const getAllPRNewsWire = await PRNewsWireSchema.find();
        emailSent(req, res, getAllPRNewsWire, last75DaysData, PRNewsWireSchema, flag);
        await browser.close();
      } catch (error) {
        console.error("Error:", error);
        {
          flag !== true && (
            res.status(500).send("Internal Server Error"))
        }
      }
    } catch (error) {
      console.error("Error:", error);
      {
        flag !== true && (
          res.status(500).send("Internal Server Error"))
      }
    } 
  }
};

// Delete PRNewsWire

exports.deletePRNewsWireAll = async (req, res) => {
  PRNewsWireSchema.deleteMany({})
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
