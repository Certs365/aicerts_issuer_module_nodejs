const express = require('express');
const router = express.Router();

let auth = require("./auth");
let user = require("./user");
let verify = require("./verify");
let fetch = require("./fetch");
let subscribe = require("./subscribe");
let health = require("./health");
let email = require("./emailRoutes");

router.use(auth);
router.use(user);
router.use(verify);
router.use(fetch);
router.use(subscribe);
router.use(health);
router.use(email);

module.exports = router