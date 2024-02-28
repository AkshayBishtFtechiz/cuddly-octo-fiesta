const NewsFileSchema = require("../Schema/NewsFileModel");
const puppeteer = require("puppeteer");
const moment = require("moment");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");

// NEWS FILE API

exports.getAllNewsFile = async (req, res) => {
  const { flag, index} = req.body;
  
  try {
    if (flag === true) {
      var law_firms = [];
      var listed_firms = [];
      var getAllNewsFirm = await NewFirmsWireSchema.find()
      
      getAllNewsFirm?.forEach((response, i) => {
        listed_firms.push(response.firmName);
        law_firms.push({
          index,
          name: response.firmName
        });
      })
    }
    else {
      var law_firms = [
        {
          index: 7427,
          name: "Berger-Montague",
        },
        {
          index: 6535,
          name: "Bernstein-Liebhard-LLP",
        },
        {
          index: 7130,
          name: "Bronstein-Gewirtz-Grossman-LLC",
        },
        {
          index: 6455,
          name: "Faruqi-Faruqi-LLP",
        },
        {
          index: 8797,
          name: "Grabar-Law-Office",
        },
        {
          index: 7059,
          name: "Hagens-Berman-Sobol-Shapiro-LLP",
        },
        {
          index: 7699,
          name: "Kessler-Topaz-Meltzer-Check-LLP",
        },
        {
          index: 7611,
          name: "Pomerantz-LLP",
        },
        {
          index: 8569,
          name: "Rigrodsky-Law-P.A.",
        },
        {
          index: 6640,
          name: "Schall-Law-Firm",
        },
        {
          index: 7815,
          name: "Kaskela-Law-LLC",
        },
        {
          index: 9378,
          name: "Glancy-Prongay-Murray-LLP",
        },
        {
          index: 7091,
          name: "Levi-Korsinsky-LLP",
        },
        {
          index: 7397,
          name: "The-Rosen-Law-Firm-PA",
        },
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

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    const firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const newsFilesUrl = `https://www.newsfilecorp.com/company/${firm.index}/${firm.name}`;
      await page.goto(newsFilesUrl, {
        waitUntil: "domcontentloaded",
        timeout: 300000,
      });
      // await page.waitForSelector(".latest-news.no-images li", {
      //   timeout: 300000,
      // });
      await page.waitForSelector(".latest-news.no-images li");

      var newsItems = await page.$$eval(
        ".latest-news.no-images li",
        (items) => {
          return items
            .map((item) => {
              const title = item
                .querySelector("div.ln-description a.ln-title")
                ?.textContent.trim();
              const date = item
                .querySelector("div.ln-description span.date")
                ?.textContent.trim();
              const link = item
                .querySelector("div.ln-description a.ln-title")
                ?.getAttribute("href");
              const summary = item
                .querySelector("div.ln-description p")
                ?.textContent.trim();

              return {
                title,
                date,
                link,
                summary,
              };
            })
            .filter((item) => {
              return (
                item?.summary?.includes("(NASDAQ:") ||
                item?.summary?.includes("(NYSE:") ||
                item?.summary?.includes("(OTCBB:")
              );
            });
        }
      );

      const payload = newsItems
        .map((newsItem) => {
          const tickerMatch = newsItem.summary.match(
            /\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/
          );
          const formattedDate = moment(newsItem.date, [
            "YYYY-MM-DD h:mm A Z",
          ]).format("MMMM DD, YYYY");
          const id = uuidv4();

          // Check if tickerSymbol and tickerIssuer are not blank
          if (
            tickerMatch &&
            tickerMatch[2].trim() &&
            newsItem.summary.includes("(NASDAQ:")
          ) {
            return {
              scrapId: id,
              tickerSymbol: tickerMatch[2].trim(),
              firmIssuing: law_firms[i].name,
              serviceIssuedOn: "News File Corp", // Replace with actual service
              dateTimeIssued: formattedDate, // Use the current date and time
              urlToRelease: `https://www.newsfilecorp.com/${newsItem.link}`,
              tickerIssuer: "NASDAQ",
            };
          } else if (
            tickerMatch &&
            tickerMatch[2].trim() &&
            newsItem.summary.includes("(NYSE:")
          ) {
            return {
              scrapId: id,
              tickerSymbol: tickerMatch[2].trim(),
              firmIssuing: law_firms[i].name,
              serviceIssuedOn: "News File Corp", // Replace with actual service
              dateTimeIssued: formattedDate, // Use the current date and time
              urlToRelease: `https://www.newsfilecorp.com/${newsItem.link}`,
              tickerIssuer: "NYSE",
            };
          } else if (
            tickerMatch &&
            tickerMatch[2].trim() &&
            newsItem.summary.includes("(OTCBB:")
          ) {
            return {
              scrapId: id,
              tickerSymbol: tickerMatch[2].trim(),
              firmIssuing: law_firms[i].name,
              serviceIssuedOn: "News File Corp", // Replace with actual service
              dateTimeIssued: formattedDate, // Use the current date and time
              urlToRelease: `https://www.newsfilecorp.com/${newsItem.link}`,
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
        tickerSymbol: "SERVtest",
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
        tickerSymbol: "BIDUtest",
        firmIssuing: "Berger Montague",
        serviceIssuedOn: "BusinessWire",
        dateTimeIssued: "January 05, 2024",
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
      const getAllNewsFile = await NewsFileSchema.find();
      emailSent(req, res, getAllNewsFile, last75DaysData, NewsFileSchema, flag);
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
};

// Delete NewsFile

exports.deleteNewsFile = async (req, res) => {
  NewsFileSchema.deleteMany({})
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
