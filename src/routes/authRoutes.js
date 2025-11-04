// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../validators/authValidator');

router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);

module.exports = router;
