const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Meal = require('../models/meal');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.mealById = (req, res, next, id) => {
    Meal.findById(id)
        .populate('category')
        .exec((err, meal) => {
            if (err || !meal) {
                return res.status(400).json({
                    error: 'Meal not found'
                });
            }
            req.meal = meal;
            next();
        });
};

exports.read = (req, res) => {
    req.meal.photo = undefined;
    return res.json(req.meal);
};

exports.create = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields) => {
        // check for all fields
        const { name, description, price, category } = fields;

        if (!name || !description || !price || !category) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }
        let meal = new Meal(fields);
        meal.save((err, result) => {
            if (err) {
                console.log('MEAL CREATE ERROR ', err);
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};

exports.remove = (req, res) => {
    let meal = req.meal;
    meal.remove((err, deletedMeal) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            message: 'Meal deleted successfully'
        });
    });
};

exports.update = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }

        let meal = req.meal;
        meal = _.extend(meal, fields);
        
        meal.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};

exports.list = (req, res) => {
    let order = req.query.order ? req.query.order : 'asc';
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 9;

    Meal.find()
        .select('-photo')
        .populate('category')
        .sort([[sortBy, order]])
        // .limit(limit)
        .exec((err, meals) => {
            if (err) {
                return res.status(400).json({
                    error: 'Meals not found'
                });
            }
            res.json(meals);
        });
};


exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    Meal.find({ _id: { $ne: req.meal }, category: req.meal.category })
        .limit(limit)
        .populate('category', '_id name')
        .exec((err, meals) => {
            if (err) {
                return res.status(400).json({
                    error: 'meals not found'
                });
            }
            res.json(meals);
        });
};

exports.listCategories = (req, res) => {
    Meal.distinct('category', {}, (err, categories) => {
        if (err) {
            return res.status(400).json({
                error: 'Categories not found'
            });
        }
        res.json(categories);
    });
};

exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : 'desc';
    let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === 'price') {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Meal.find(findArgs)
        .select('-photo')
        .populate('category')
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: 'Mealss not found'
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

exports.photo = (req, res, next) => {
    if (req.meal.photo.data) {
        res.set('Content-Type', req.meal.photo.contentType);
        return res.send(req.meal.photo.data);
    }
    next();
};

exports.listSearch = (req, res) => {
    // create query object to hold search value and category value
    const query = {};
    // assign search value to query.name
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: 'i' };
        // assigne category value to query.category
        if (req.query.category && req.query.category != 'All') {
            query.category = req.query.category;
        }
        // search and category
        Meal.find(query, (err, meals) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(meals);
        }).select('-photo');
    }
};

exports.decreaseQuantity = (req, res, next) => {
    let bulkOps = req.body.order.meals.map(item => {
        return {
            updateOne: {
                filter: { _id: item._id },
                update: { $inc: { quantity: -item.count, sold: +item.count } }
            }
        };
    });

    Meal.bulkWrite(bulkOps, {}, (error, mealss) => {
        if (error) {
            return res.status(400).json({
                error: 'Could not update meal'
            });
        }
        next();
    });
};
