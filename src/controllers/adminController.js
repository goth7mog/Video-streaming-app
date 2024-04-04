const bcrypt = require("bcryptjs");


/**
 * GET /
 * Homepage 
*/
exports.index = async (req, res) => {

    // console.log(req.headers['user-agent']);

    // return res.status(403).render("404", {
    //     "isLogin": true,
    //     "message": "Sorry, you do not own this video.",
    //     "url": req.url
    // });
    //     const variable = 'Hi';

    // if(variable === 'Hi') {
    //   console.log('yep');
    // } else if (variable != "") {
    //   console.log('yes')
    // }

    // res.clearCookie('accessToken');
    // res.clearCookie('refreshToken');

    // console.log(req.cookies.accessToken);
    // console.log(req.cookies);

    try {
        if (req.session.user_id) {
            const MESSAGES = req.flash('loginMessage');

            const videos = await global.database.collection("videos").find({}).sort({ "createdAt": -1 }).toArray();

            res.status(200).render("admin/index", {
                "isLogin": req.session.user_id ? true : false,
                "videos": videos,
                "url": req.url,
                "message": MESSAGES[0] || ""
            });

        } else {
            res.redirect("/admin/login?error=Your+session+expired");
        }
    } catch (err) {

        res.status(500).render("admin/500", {
            "isLogin": req.session.user_id ? true : false,
            "message": "500 - Error occured",
            "url": req.url
        });
    }
};


exports.getRegistrationPage = async (req, res) => {
    try {
        if (req.session.user_id) {
            res.redirect("/admin");
            return;
        }
        res.status(200).render("admin/register", {
            "error": "",
            "message": ""
        });
    } catch (err) {
        res.status(500).render("admin/500", {
            "isLogin": req.session.user_id ? true : false,
            "message": "500 - Error occured",
            "url": req.url
        });
    }
};

exports.register = async (req, res) => {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;

    try {
        if (first_name == "" || last_name == "" || email == "" || password == "") {
            res.status(400).render("admin/register", {
                "error": "Please fill in all fields",
                "message": ""
            });
            return;
        }

        const user = await global.database.collection("users").findOne({
            "email": email
        });

        if (user == null) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            const result = await global.database.collection("users").insertOne({
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "password": hash,
                "subscribers": []
            });

            if (result) {
                req.flash("registerMessage", "Signed up successfully. You can login in now");
                res.redirect("/admin/login");
            } else {
                throw new Error(`result - ${result}`);
            }
        } else {
            res.status(409).render("register", {
                "error": "Email already exists",
                "message": ""
            });
        }

    } catch (err) {
        res.status(500).render("admin/500", {
            "isLogin": req.session.user_id ? true : false,
            "message": "500 - Error occured",
            "url": req.url
        });
    }

};


exports.getLoginPage = async (req, res) => {
    // res.clearCookie('accessToken');
    try {
        const MESSAGES = req.flash('registerMessage');

        if (req.session.user_id) {
            res.redirect("/admin");
            return;
        }
        res.status(200).render("admin/login", {
            "error": req.query.error ? req.query.error : "",
            "message": MESSAGES[0] || ""
        });
    } catch (err) {
        res.status(500).render("admin/500", {
            "isLogin": req.session.user_id ? true : false,
            "message": "500 - Error occured",
            "url": req.url
        });
    }

};

exports.login = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;


    try {
        if (email == "" || password == "") {
            return res.status(400).render("admin/login", {
                "error": "Please fill all fields",
                "message": ""
            });
        }

        const user = await global.database.collection("users").findOne({
            "email": email
        });

        if (user == null) {
            res.status(401).render("admin/login", {
                "error": "Email does not exist",
                "message": ""
            });
        } else {
            const result = await bcrypt.compare(password, user.password);

            if (result === true) {
                req.session.user_id = user._id;
                req.flash("loginMessage", "Login success");
                res.redirect("/admin");
            } else {
                res.status(401).render("admin/login", {
                    "error": "Password is not correct",
                    "message": ""
                });
            }
        }

    } catch (err) {
        res.status(500).render("admin/500", {
            "isLogin": req.session.user_id ? true : false,
            "message": "500 - Error occured",
            "url": req.url
        });
    }

};

