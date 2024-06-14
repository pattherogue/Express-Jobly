"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const { BadRequestError, UnauthorizedError } = require("../expressError");

const router = express.Router();

/**
 * POST /users - Adds a new user by an admin.
 * Authorization required: Admin
 * This returns the newly created user and an authentication token for them:
 * { user: { username, firstName, lastName, email, isAdmin }, token }
 */
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

/**
 * GET /users - Returns list of all users.
 * Authorization required: Admin
 */
router.get("/", ensureAdmin, async function (req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/**
 * GET /users/:username - Returns { username, firstName, lastName, isAdmin }
 * Authorization required: User or Admin
 */
router.get("/:username", ensureLoggedIn, async function (req, res, next) {
    try {
        const username = req.params.username;
        const user = await User.get(username);
        if (!user) {
            throw new NotFoundError(`User not found: ${username}`);
        }
        if (req.user.username !== username && !req.user.isAdmin) {
            throw new UnauthorizedError();
        }
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/**
 * PATCH /users/:username - Updates user details.
 * Authorization required: User or Admin
 * Data can include: { firstName, lastName, password, email, isAdmin }
 */
router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
    try {
        const username = req.params.username;
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        if (req.user.username !== username && !req.user.isAdmin) {
            throw new UnauthorizedError();
        }

        const user = await User.update(username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/**
 * DELETE /users/:username - Deletes a user.
 * Authorization required: User or Admin
 */
router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
    try {
        const username = req.params.username;
        if (req.user.username !== username && !req.user.isAdmin) {
            throw new UnauthorizedError();
        }

        await User.remove(username);
        return res.json({ deleted: username });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
