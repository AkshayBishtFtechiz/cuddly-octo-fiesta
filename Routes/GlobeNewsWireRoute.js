const GlobeNewsWireRoute = (app) => {
  const globenewswire = require("../controllers/globenewswire.controller");
  var router = require("express").Router();

  // Get all GlobeNewsWire details
  /**
   * @swagger
   * /api/globe-news-wire:
   *  get:
   *     tags:
   *     - Globnewswire
   *     description: Returns API operational status
   *     responses:
   *       200:
   *         description: API is  running
   */
  router.get("/globe-news-wire", globenewswire.getAllGlobeNewsWire);

  // Delete GlobeNewsWire details
  
   /**
     * @swagger
     * '/api/globe-news-wire/deleteall':
     *  delete:
     *     tags:
     *     - Globnews Deleted
     *     summary: Delete_Newswire
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
    "/globe-news-wire/deleteall",
    globenewswire.deleteGlobeNewsWireAll
  );

  app.use("/api", router);
};
module.exports = GlobeNewsWireRoute;
