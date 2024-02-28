const NewsFileRoute = (app) => {
  const newsfilewire = require("../controllers/newsfile.controller");
  var router = require("express").Router();

  // Get all PRNewsWire details
  /**
   * @swagger
   * /api/news-files:
   *  get:
   *     tags:
   *     - Newsfilewire
   *     description: Returns API operational status
   *     responses:
   *       200:
   *         description: API is  running
   */
  router.get("/news-files", newsfilewire.getAllNewsFile);

  // Delete PRNewsWire details
  /**
     * @swagger
     * '/api/news-files/deleteall':
     *  delete:
     *     tags:
     *     - NewsFile Deleted
     *     summary: Delete_Newwire
     *     responses:
     *      200:
     *        description: Removed
     *      400:
     *        description: Bad request
     *      404:
     *        description: Not Found
     *      500:
     *        description: Server Error
     */
  router.delete("/news-files/deleteall", newsfilewire.deleteNewsFile);

  app.use("/api", router);
};
module.exports = NewsFileRoute;
