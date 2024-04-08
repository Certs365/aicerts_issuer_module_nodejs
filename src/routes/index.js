const express = require('express');
const router = express.Router();

let auth = require("./auth")
let user = require("./user")
let verify = require("./verify")


router.use(auth);
router.use(user);
router.use(verify);

module.exports = router