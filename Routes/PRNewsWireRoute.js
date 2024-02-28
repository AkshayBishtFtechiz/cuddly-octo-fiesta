const PRNewsWireRoute = (app) => {
  const prnewswire = require("../controllers/prnewswire.controller");
  var router = require("express").Router();

  // Get all PRNewsWire details
  /**
   * @swagger
   * /api/pr-news-wire:
   *  get:
   *     tags:
   *     - PrNewswire
   *     description: Returns API operational status
   *     responses:
   *       200:
   *         description: API is  running
   */
  router.get("/pr-news-wire", prnewswire.getAllPRNewsWire);

  // Delete PRNewsWire details
  /**
     * @swagger
     * '/api/pr-news-wire/deleteall':
     *  delete:
     *     tags:
     *     - PrNewsWire Deleted
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
  router.delete(
    "/pr-news-wire/deleteall",
    prnewswire.deletePRNewsWireAll
  );

  app.use("/api", router);
};
module.exports = PRNewsWireRoute;
