const axios = require("axios");
const cheerio = require("cheerio");
const NewsFileSchema = require("../Schema/NewsFileModel");
const moment = require("moment");
const emailSent = require("../utils/emailSent");
const { filterDays } = require("../utils/filterDays");
const { v4: uuidv4 } = require("uuid");
const NewFirmsWireSchema = require("../Schema/NewFirmModel");

exports.getAllNewsFile = async (req, res) => {
  const { flag } = req.body;

  try {
    let law_firms = [];
    let listed_firms = [];
    if (flag === true) {
      const getAllNewsFirm = await NewFirmsWireSchema.find();
      listed_firms = getAllNewsFirm.map((response) => response.firmName);
      law_firms = getAllNewsFirm.map((response) => ({
        index: response.index,
        name: response.firmName,
      }));
    } else {
      law_firms = [
        { index: 7427, name: "Berger-Montague" },
        { index: 6535, name: "Bernstein-Liebhard-LLP" },
        { index: 7130, name: "Bronstein-Gewirtz-Grossman-LLC" },
        { index: 6455, name: "Faruqi-Faruqi-LLP" },
        { index: 8797, name: "Grabar-Law-Office" },
        { index: 7059, name: "Hagens-Berman-Sobol-Shapiro-LLP" },
        { index: 7699, name: "Kessler-Topaz-Meltzer-Check-LLP" },
        { index: 7611, name: "Pomerantz-LLP" },
        { index: 8569, name: "Rigrodsky-Law-P.A." },
        { index: 6640, name: "Schall-Law-Firm" },
        { index: 7815, name: "Kaskela-Law-LLC" },
        { index: 9378, name: "Glancy-Prongay-Murray-LLP" },
        { index: 7091, name: "Levi-Korsinsky-LLP" },
        { index: 7397, name: "The-Rosen-Law-Firm-PA" },
      ];

      listed_firms = [
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

    const firmData = [];

    for (let i = 0; i < law_firms.length; i++) {
      const firm = law_firms[i];
      const newsFilesUrl = `https://www.newsfilecorp.com/company/${firm.index}/${firm.name}`;
      const response = await axios.get(newsFilesUrl);
      const $ = cheerio.load(response.data);

      const newsItems = $(".latest-news.no-images li")
        .map((index, element) => {
          const $element = $(element);
          const title = $element
            .find("div.ln-description a.ln-title")
            .text()
            .trim();
          const date = $element
            .find("div.ln-description span.date")
            .text()
            .trim();
          const link = $element
            .find("div.ln-description a.ln-title")
            .attr("href");
          const summary = $element.find("div.ln-description p").text().trim();

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
            item.summary.includes("(OTCBB:")
          );
        })
        .map((newsItem) => {
          const tickerMatch = newsItem.summary.match(
            /\((NASDAQ|NYSE|OTCBB):([^\)]+)\)/
          );
          const formattedDate = moment(newsItem.date, [
            "YYYY-MM-DD h:mm A Z",
          ]).format("MMMM DD, YYYY");
          const id = uuidv4();

          if (tickerMatch && tickerMatch[2].trim()) {
            return {
              scrapId: id,
              tickerSymbol: tickerMatch[2].trim(),
              firmIssuing: firm.name,
              serviceIssuedOn: "News File Corp", // Replace with actual service
              dateTimeIssued: formattedDate,
              urlToRelease: `https://www.newsfilecorp.com${newsItem.link}`,
              tickerIssuer: tickerMatch[1].toUpperCase(),
            };
          } else {
            return null;
          }
        })
        .filter(Boolean);

      for (const newsData of payload) {
        firmData.push({ firm: listed_firms[i], payload: newsData });
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
    const getAllNewsFile = await NewsFileSchema.find();
    emailSent(req, res, getAllNewsFile, last75DaysData, NewsFileSchema, flag);
  } catch (error) {
    console.error("Error:", error);
    flag !== true && res.status(500).send("Internal Server Error");
  }
};

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
