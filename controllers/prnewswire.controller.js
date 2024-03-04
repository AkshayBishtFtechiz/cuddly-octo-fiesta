const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const PRNewsWireSchema = require("../Schema/PRNewsWireModel");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");

exports.getAllPRNewsWire = async (req, res) => {
  const { flag } = req.body;

  try {
    let law_firms = [];
    let listed_firms = [];
    if (flag) {
      const getAllNewsFirm = await NewFirmsWireSchema.find();
      law_firms = getAllNewsFirm.map((response) => response.firmName);
      listed_firms = getAllNewsFirm.map((response) => response.firmName);
    } else {
      law_firms = [
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

      listed_firms = [
        "Berger Montague",
        "Bernstein Liebhard",
        "Bronstein, Gewirtz",
        "Faruqi & Faruqi",
        // "Grabar",
        "Hagens Berman",
        "Kessler Topaz",
        "Pomerantz",
        // "Rigrodsky",
        "Schall",
        "Kaskela",
        "Glancy",
        "Levi & Korsinsky",
        "Rosen",
      ];
    }

    const firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const listedFirms = listed_firms[i];
      const encodedFirm = encodeURI(firm);
      const prNewsUrl = `https://www.prnewswire.com/news/${encodedFirm}/`;
      const response = await axios.get(prNewsUrl);
      const $ = cheerio.load(response.data);

      const newsItems = $(".card-list .newsCards")
        .map((index, element) => {
          const $element = $(element);
          const title = $element.find("h3 small").next().text().trim();
          const date = $element.find("h3 small").text().trim();
          const link = $element.find("a").attr("href");
          const summary = $element.find("p").text().trim();

          return {
            title,
            date,
            link,
            summary,
          };
        })
        .get();

      const payload = newsItems
        .filter((item) => {
          return (
            item.summary.includes("(NASDAQ:") ||
            item.summary.includes("(NYSE:") ||
            item.summary.includes("(OTCBB:") ||
            item.title.includes("(NASDAQ:") ||
            item.title.includes("(NYSE:") ||
            item.title.includes("(OTCBB:")
          );
        })
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

          if (tickerSymbolMatch && tickerSymbolMatch[1]) {
            return {
              scrapId: id,
              tickerSymbol: tickerSymbolMatch[1], // Extracted first ticker symbol
              firmIssuing: firm,
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
        firmData.push({ firm: listedFirms, payload: newsData });
      }
    }

    const { targetDate } = filterDays(75);
    const last75DaysData = firmData.filter((newsDetails) => {
      const allPRNewsDate = moment(
        newsDetails?.payload.dateTimeIssued,
        "MMMM DD, YYYY"
      );
      return targetDate < allPRNewsDate;
    });
    const getAllPRNewsWire = await PRNewsWireSchema.find();
    emailSent(
      req,
      res,
      getAllPRNewsWire,
      last75DaysData,
      PRNewsWireSchema,
      flag
    );
  } catch (error) {
    console.error("Error:", error);
    flag !== true && res.status(500).send("Internal Server Error");
  }
};

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
