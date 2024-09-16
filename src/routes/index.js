const express = require('express');
const router = express.Router();

let auth = require("./auth");
let user = require("./user");
let verify = require("./verify");
let fetch = require("./fetch");
let health = require("./health");

router.use(auth);
router.use(user);
router.use(verify);
router.use(fetch);
router.use(health);

module.exports = router