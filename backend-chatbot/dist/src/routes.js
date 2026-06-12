"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("./controllers");
const router = (0, express_1.Router)();
router.post('/login', controllers_1.loginAdmin);
router.get('/chats', controllers_1.getChats);
router.get('/messages/:userId', controllers_1.getMessages);
exports.default = router;
