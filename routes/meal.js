const express = require("express");
const router = express.Router();

const { create, mealById, read, remove, update, list, listRelated, listCategories, listBySearch, photo, listSearch } = require("../controllers/meal");
const { requireSignin, isAuth, isAdmin } = require("../controllers/auth");
const { userById } = require("../controllers/user");

router.get("/meal/:mealId", read);
router.post(
    "/meal/create/:userId", 
    requireSignin, 
    isAuth, 
    isAdmin, 
    create
);
router.delete(
    "/meal/:mealId/:userId",
    requireSignin,
    isAuth,
    isAdmin,
    remove
);
router.put(
    "/meal/:mealId/:userId",
    requireSignin,
    isAuth,
    isAdmin,
    update
);
router.get("/meals", list);

router.get("/meals/search", listSearch);
router.get("/meals/related/:mealId", listRelated);
router.get("/meals/categories", listCategories);
router.post("/meals/by/search", listBySearch);

router.param("userId", userById);
router.param("mealId", mealById);

module.exports = router;
