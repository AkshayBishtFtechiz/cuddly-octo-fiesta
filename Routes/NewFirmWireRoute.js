const NewFirmWireRoute = (app) => {
    const newfirmwire = require("../controllers/newfirmwire.controller");
    var router = require("express").Router();
  
    // Create New Firm Wire
    /** POST Methods */
    /**
     * @swagger
     * '/api/new-firm-news-wire':
     *  post:
     *     tags:
     *     - New Firm Wire News
     *     summary: Create a new firm
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - firmName
     *              - index
     *              - password
     *            properties:
     *              firmName:
     *                type: string
     *                default: example 
     *              index:
     *                type: number
     *                default: 3018
     *              flag:
     *                type: boolean
     *                default: true
     *     responses:
     *      201:
     *        description: Created
     *      409:
     *        description: Conflict
     *      404:
     *        description: Not Found
     *      500:
     *        description: Server Error
     */
    router.post("/new-firm-news-wire", newfirmwire.createNewFirmWire);

  // Get New Firm Wire
  /**
   * @swagger
   * /api/new-firm-news-wire-getdetails:
   *  get:
   *     tags:
   *     - New Firm News Wire Details
   *     description: Returns API operational status
   *     responses:
   *       200:
   *         description: API is  running
   */
    router.get("/new-firm-news-wire-getdetails", newfirmwire.getNewFirmDetails);

  // Delete New Firm Wire
  /**
     * @swagger
     * '/api/new-firm-news-wire/delete':
     *  delete:
     *     tags:
     *     - New Firm News Wire Details Delete By Id
     *     summary: Delete user by Id
     *     parameters:
     *      - name: _id
     *        in: path
     *        description: The unique Id of firmwire
     *        required: true
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

    router.delete("/new-firm-news-wire/delete", newfirmwire.deleteNewFirmWire);

  // Delete All New Firm Wire
  /**
     * @swagger
     * '/api/new-firm-news-wire/deleteall':
     *  delete:
     *     tags:
     *     - New Firm News Wire Details DeleteAll
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
    router.delete("/new-firm-news-wire/deleteall", newfirmwire.deleteAllNewFirmWire);
    
    app.use("/api", router);
  };
  module.exports = NewFirmWireRoute;
  