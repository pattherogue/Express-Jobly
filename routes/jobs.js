"use strict";

const express = require("express");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jsonschema = require("jsonschema");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const { BadRequestError } = require("../expressError");

const router = new express.Router();

/** POST /jobs - Create a new job.
 *
 * Data should include { title, salary, equity, companyHandle }
 * Returns { id, title, salary, equity, companyHandle }
 * Authorization required: Admin
 */
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs.join(", "));
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /jobs - Get all jobs with optional filtering.
 *
 * Filters can be provided in query: title, minSalary, hasEquity
 * Returns [{ id, title, salary, equity, companyHandle }, ...]
 * Authorization required: None
 */
router.get("/", async function (req, res, next) {
    try {
        const { title, minSalary, hasEquity } = req.query;
        const filters = {
            title,
            minSalary: minSalary ? parseInt(minSalary) : undefined,
            hasEquity: hasEquity === "true"
        };
        const jobs = await Job.findAll(filters);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /jobs/:id - Get detail about a job.
 *
 * Returns { id, title, salary, equity, companyHandle }
 * Authorization required: None
 */
router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /jobs/:id - Update a job's details.
 *
 * Data can include { title, salary, equity }
 * Returns { id, title, salary, equity, companyHandle }
 * Authorization required: Admin
 */
router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs.join(", "));
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /jobs/:id - Delete a job.
 *
 * Returns { deleted: id }
 * Authorization required: Admin
 */
router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
