"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, NotFoundError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/**
 * POST /companies - Create a new company.
 *
 * Requires { handle, name, description, numEmployees, logoUrl } in body.
 * Returns { handle, name, description, numEmployees, logoUrl }
 * Authorization required: Admin
 */
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, companyNewSchema);
        if (!validator.valid) {
            const errors = validator.errors.map(e => e.stack);
            throw new BadRequestError(errors.join(", "));
        }

        const company = await Company.create(req.body);
        return res.status(201).json({ company });
    } catch (err) {
        return next(err);
    }
});

/**
 * GET /companies - Get all companies with optional filtering.
 *
 * Filters can be provided in query: name, minEmployees, maxEmployees
 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
 * Authorization required: None
 */
router.get("/", async function (req, res, next) {
    try {
        const { name, minEmployees, maxEmployees } = req.query;
        const filters = { name, minEmployees: parseInt(minEmployees), maxEmployees: parseInt(maxEmployees) };
        const companies = await Company.findAll(filters);
        return res.json({ companies });
    } catch (err) {
        return next(err);
    }
});

/**
 * GET /companies/:handle - Get details about a specific company by handle.
 *
 * Returns { handle, name, description, numEmployees, logoUrl, jobs }
 * where jobs is [{ id, title, salary, equity }, ...]
 * Authorization required: None
 */
router.get("/:handle", async function (req, res, next) {
    try {
        const company = await Company.get(req.params.handle);
        if (!company) {
            throw new NotFoundError(`No company found with handle: ${req.params.handle}`);
        }
        return res.json({ company });
    } catch (err) {
        return next(err);
    }
});

/**
 * PATCH /companies/:handle - Update a company's details.
 *
 * Data can include { name, description, numEmployees, logoUrl }
 * Returns { handle, name, description, numEmployees, logoUrl }
 * Authorization required: Admin
 */
router.patch("/:handle", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, companyUpdateSchema);
        if (!validator.valid) {
            const errors = validator.errors.map(e => e.stack);
            throw new BadRequestError(errors.join(", "));
        }

        const company = await Company.update(req.params.handle, req.body);
        return res.json({ company });
    } catch (err) {
        return next(err);
    }
});

/**
 * DELETE /companies/:handle - Delete a company by handle.
 *
 * Returns { deleted: handle }
 * Authorization required: Admin
 */
router.delete("/:handle", ensureAdmin, async function (req, res, next) {
    try {
        await Company.remove(req.params.handle);
        return res.json({ deleted: req.params.handle });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
