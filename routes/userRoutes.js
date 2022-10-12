const router = require("express").Router();

const fileUpload = require("../middlewares/file-upload");

const userControllers = require("../controllers/userControllers");
const checkAuth = require("../middlewares/check-auth");

router.post("/signuptomakesoftappsadmin", userControllers.signup);
router.get("/check", userControllers.login);
router.post("/login", userControllers.login);

router.post("/contact", userControllers.contact);
router.post("/job", fileUpload.single("cv"), userControllers.job);

router.use(checkAuth);

router.post("/get-contacts", userControllers.getContacts);
router.post("/delete-contact", userControllers.deleteContact);

router.post("/get-cvs", userControllers.getJobs);
router.post("/delete-cv", userControllers.deleteJob);

module.exports = router;
