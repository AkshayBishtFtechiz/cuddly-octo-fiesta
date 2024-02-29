require("dotenv").config();
const BusinessWireSchema = require("../Schema/BusinessWireModel");
const puppeteer = require("puppeteer");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");

// BUSINESS WIRE API

exports.getAllBussinessWire = async (req, res) => {
  const { flag } = req.body;

  try {
    if (flag === true) {
      var law_firms = [];
      var getAllNewsFirm = await NewFirmsWireSchema.find();

      getAllNewsFirm?.forEach((response, index) => {
        law_firms.push(response.firmName);
      });
      var listed_firms = [...law_firms];
    } else {
      var law_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        "Grabar",
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

      var listed_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        "Grabar",
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

    let firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const encodedFirm = encodeURI(firm);
      const businessWireUrl = `https://www.businesswire.com/portal/site/home/search/?searchType=all&searchTerm=${encodedFirm}&searchPage=1`;
      await page.goto(businessWireUrl, {
        waitUntil: "domcontentloaded",
        timeout: 300000,
      });
      // await page.waitForSelector(".bw-news-section li", { timeout: 300000 });
      await page.waitForSelector(".bw-news-section li");

      const newsItems = await page.$$eval(".bw-news-section li", (items) => {
        return items
          .map((item) => {
            const title = item.querySelector("h3 a").textContent.trim();
            const date = item
              .querySelector(".bw-news-meta time")
              .textContent.trim();
            const link = item.querySelector("h3 a").getAttribute("href");
            const summary = item.querySelector("p").textContent.trim();
            const thumb = item
              .querySelector(".bw-news-thumbs a")
              ?.getAttribute("href");

            return {
              title,
              date,
              link,
              summary,
              thumb,
            };
          })
          .filter((item) => {
            return (
              item.summary.includes("(NASDAQ:") ||
              item.summary.includes("(NYSE:") ||
              item.summary.includes("(OTCBB:")
            );
          });
      });

      const payload = newsItems
        .map((newsItem) => {
          const tickerMatch = newsItem.summary.match(
            /\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/
          );
          const id = uuidv4();

          const tickerSymbol = tickerMatch ? tickerMatch[2].trim() : "";
          const tickerIssuer = newsItem.summary.includes("(NASDAQ:")
            ? "NASDAQ"
            : newsItem.summary.includes("(NYSE:")
            ? "NYSE"
            : newsItem.summary.includes("(OTCBB:")
            ? "OTCBB"
            : "";

          // Check if both tickerSymbol and tickerIssuer are not blank
          if (tickerSymbol && tickerIssuer && newsItem.thumb !== undefined) {
            return {
              scrapId: id,
              tickerSymbol: tickerSymbol,
              firmIssuing: law_firms[i],
              serviceIssuedOn: "BusinessWire",
              dateTimeIssued: newsItem.date,
              urlToRelease: newsItem.link,
              tickerIssuer: tickerIssuer,
            };
          } else {
            return null; // Exclude news items with blank tickerSymbol or tickerIssuer
          }
        })
        .filter((item) => item !== null); // Filter out null items (news items with blank tickerSymbol or tickerIssuer)

      for (const newsData of payload) {
        firmData.push({ firm: listed_firms[i], payload: newsData });
      }
    }

    // JSON OF NEW TICKER.

    // firmData.push({
    //   firm: "Berger Montague",
    //   payload: {
    //     scrapId: uuidv4(),
    //     tickerSymbol: "NEWTICKER", // NEW TICKER THAT COMES
    //     firmIssuing: "Berger Montague",
    //     serviceIssuedOn: "BusinessWire",
    //     dateTimeIssued: "January 23, 2024",
    //     urlToRelease:
    //       "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
    //     tickerIssuer: "NYSE",
    //   },
    // });

    // JSON OF TICKER ALREADY THAT EXISTS IN LAST 60 DAYS.

    // firmData.push({
    //   firm: "Levi & Korsinsky",
    //   payload: {
    //     scrapId: uuidv4(),
    //     tickerSymbol: "BTI", //TICKER ALREADY EXISTS
    //     firmIssuing: "Levi & Korsinsky",
    //     serviceIssuedOn: "BusinessWire",
    //     dateTimeIssued: "January 31, 2024",
    //     urlToRelease:
    //       "http://www.businesswire.com/news/home/20240101367342/zh-HK/",
    //     tickerIssuer: "NASDAQ",
    //   },
    // });

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
      const getAllBusinessNews = await BusinessWireSchema.find();
      emailSent(
        req,
        res,
        getAllBusinessNews,
        last75DaysData,
        BusinessWireSchema,
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

// Delete BussinessWireNews

exports.deleteBussinessAll = async (req, res) => {
  BusinessWireSchema.deleteMany({})
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
