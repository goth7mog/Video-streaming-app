const express = require('express');
const router = express.Router();
const siteController = require(global.approute + '/controllers/siteController');
const { verifyToken, verifyAccessToStream } = require(global.approute + "/middleware/verifyToken.js");
const _KEYS = require(global.approute + '/config/keys');
const ObjectId = require("mongodb").ObjectId;
const Nodemailer = require("nodemailer");
const nodemailerObject = {
	service: "gmail",
	host: 'smtp.gmail.com',
    port: 587,
    secure: true,
	auth: {
		user: process.env.DOMAIN_EMAIL,
		pass: process.env.EMAIL_APP_PASSWORD
	}
};


/**
 * Website Routes 
*/

router.get("/", async (req, res) => {
	try {
        res.status(200).render("site/about-me", {
            "isLogin": req.session.user_id ? true : false,
            "url": req.url
        });

    } catch(err) {
        res.status(500).render("site/error-page", {
            "isLogin": req.session.user_id ? true : false,
			"message": "Something went wrong",
			"code": 500,
			"url": req.url
        });
    }
});

router.get("/about-hypnotherapy", async (req, res) => {
	try {
        res.status(200).render("site/about-hypnotherapy", {
            "isLogin": req.session.user_id ? true : false,
            "url": req.url
        });

    } catch(err) {
        res.status(500).render("site/error-page", {
            "isLogin": req.session.user_id ? true : false,
			"message": "Something went wrong",
			"code": 500,
			"url": req.url
        });
    }
});

router.get("/request-consultation", async (req, res) => {
	res.redirect("/");
});

router.post("/request-consultation", async (req, res) => {
	const userEmail = req.body.userEmail || null;
	const userFullName = req.body.userFullName || null;
	const userService = req.body.userService || null;
	const userTelephone = req.body.userTelephone || null;
	const userAppointmentDate = req.body.userAppointmentDate || null;
	const userAppointmentTime = req.body.userAppointmentTime || null;
	const userMessage = req.body.userMessage || null;


    try {

		// throw new Error('Some');

		// return res.status(400).render("site/about-me", {
		// 	"isLogin": req.session.user_id ? true : false,
		// 	"url": req.url,
		// 	"error": "Please fill in all the required fields",
		// 	"message": ""
		// });

		// return res.status(400).render("site/error-page", {
		// 	"isLogin": req.session.user_id ? true : false,
		// 	"message": "Please fill in all the required fields",
		// 	"code": "400",
		// 	"url": req.url
		// });

        if (userEmail === null
			|| userFullName === null 
			|| userService === null 
			|| userTelephone === null 
			|| userAppointmentDate === null 
			|| userAppointmentTime === null) 
		{
			return res.status(400).render("site/error-page", {
				"isLogin": req.session.user_id ? true : false,
				"message": "Please fill in all the required fields",
				"code": "400",
				"url": req.url
			});
        }

		const AppointmentTime = global.dayjs.tz(`${userAppointmentDate} ${userAppointmentTime}`, "America/Panama").valueOf();

		if ( AppointmentTime <= new Date().getTime() ) {
			return res.status(400).render("site/error-page", {
				"isLogin": req.session.user_id ? true : false,
				"message": "Please, pick the future time for the appointment",
				"code": "400",
				"url": req.url
			});
        }

		const transporter = Nodemailer.createTransport(nodemailerObject);

		const mailOptions = {
			from: {
				name: "Hipnonutricion",
				address: process.env.DOMAIN_EMAIL
			},
			to: process.env.ADMIN_EMAIL,
			subject: "New appointment",
			// text: 'Test',
			html: `
			<!DOCTYPE html>
			<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
			<head>
			  <meta charset="UTF-8">
			  <meta name="viewport" content="width=device-width,initial-scale=1">
			  <meta name="x-apple-disable-message-reformatting">
			  <title></title>
			  <!--[if mso]>
			  <noscript>
				<xml>
				  <o:OfficeDocumentSettings>
					<o:PixelsPerInch>96</o:PixelsPerInch>
				  </o:OfficeDocumentSettings>
				</xml>
			  </noscript>
			  <![endif]-->
			  <style>
				table, td, div, h1, p {font-family: Arial, sans-serif;}
			  </style>
			</head>
			<body style="margin:0;padding:0;">
			  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
				<tr>
				  <td align="center" style="padding:0;">
					<table role="presentation" style="width:602px;border-collapse:collapse;border:1px solid #cccccc;border-spacing:0;text-align:left;">
					  <tr>
						<td align="center" style="padding:40px 0 30px 0;background:#70bbd9;">
						  <img src="https://www.benchmarkemail.com/wp-content/uploads/2022/05/Email-Clients-Compatible.jpg" alt="" width="300" style="height:auto;display:block;" />
						</td>
					  </tr>
					  <tr>
						<td style="padding:36px 30px 42px 30px;">
						  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
							<tr>
								<td style="padding:0 0 5px 0;color:#153643;">
									<h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">New Appointment Request</h1>
								</td>
							</tr>
							<tr>
								<td style="font-size: 14px;padding-bottom: 10px;">
									Name: ${userFullName}
								</td>
							</tr>
							<tr>
								<td style="font-size: 14px;padding-bottom: 10px;">
									Email: ${userEmail}
								</td>
							</tr>
							<tr>
								<td style="font-size: 14px;padding-bottom: 10px;">
									Telephone: ${userTelephone}
								</td>
							</tr>
							<tr>
								<td style="font-size: 14px;padding-bottom: 10px;">
									Service: ${userService}
								</td>
							</tr>
							<tr>
								<td style="font-size: 14px;padding-bottom: 10px;">
									Appointment time (Panama Timezone): ${userAppointmentTime}, ${userAppointmentDate}
								</td>
							</tr>

							${userMessage ? '<tr><td style="font-size: 14px;padding-bottom: 10px;">Message: ' + userMessage + '</td></tr>' : '' }

						  </table>
						</td>
					  </tr>
					  <tr>
						<td style="padding:30px;background:#2f89fc;">
						  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;font-size:9px;font-family:Arial,sans-serif;">
							<tr>
							  <td style="padding:0;width:50%;" align="left">
								<p style="margin:0;font-size:14px;line-height:16px;font-family:Arial,sans-serif;color:#ffffff;">
								  <a href="http://www.example.com" style="color:#ffffff;text-decoration:underline;">&reg; myhipnonutricion.com ${new Date().getFullYear()}</a>
								</p>
							  </td>
							</tr>
						  </table>
						</td>
					  </tr>
					</table>
				  </td>
				</tr>
			  </table>
			</body>
			</html>
			`	
		};


				// console.log(userEmail);
		// console.log(userFullName);
		// console.log(userService);
		// console.log(userTelephone);
		// console.log(userAppointmentDate);
		// console.log(userAppointmentTime);
		// console.log(userMessage);

		await transporter.sendMail(mailOptions);

		const result = await global.database.collection("appointments").insertOne({
			"name": userFullName,
			"email": userEmail,
			"service": [ userService ],
			"telephone": userTelephone,
			"appointmentTime": AppointmentTime,
			"message": userMessage,
			"status": 'BOOKED',
			"createdAt": new Date().getTime()
		});

        res.redirect(`/appointment-confirmation?id=${result.insertedId}`);

    } catch(err) {
        res.status(500).render("site/error-page", {
            "isLogin": req.session.user_id ? true : false,
			"message": "Something went wrong",
			"code": 500,
			"url": req.url
        });
    }
});

router.get("/appointment-confirmation", async (req, res) => {
	const id = req.query.id;

	// console.log(id);
	try {
		if (id) {

			const Appointment = await global.database.collection("appointments").findOne({
				"_id": ObjectId(id)
			});
	
			let MESSAGE;
	
			// console.log(Appointment);
	
			if (Appointment === null) {
				MESSAGE = "Not found";
			} else {
				if (Appointment.status === 'BOOKED') {
					MESSAGE = "Booked";
				} else if (Appointment.status === 'CANCELED') {
					MESSAGE = "Canceled";
				} else if (Appointment.status === 'FINISHED') {
					MESSAGE = "Finished";
				} else {
					MESSAGE = "Uknown";
				}
			} 
	
			res.status(200).render("site/confirmation-page", {
				"isLogin": req.session.user_id ? true : false,
				"message": MESSAGE,
				"url": req.url
			});
	
		} else {
			res.status(404).render("site/404", {
				"isLogin": req.session.user_id ? true : false,
				"message": "Booking ID not provided.",
				"url": req.url
			});
		}


	} catch(err) {
		res.status(500).render("site/error-page", {
			"isLogin": req.session.user_id ? true : false,
			"message": "Something went wrong",
			"code": 500,
			"url": req.url
		});
	}

});

router.get("/videos", async (req, res) => {
	try {

		// res.clearCookie('accessToken');
        
        const videos = await global.database.collection("videos").find({}).sort({"createdAt": -1}).toArray();

        res.status(200).render("site/videos", {
            "isLogin": req.session.user_id ? true : false,
            "videos": videos,
            "url": req.url
        });

    } catch(err) {
        res.status(500).render("site/error-page", {
            "isLogin": req.session.user_id ? true : false,
			"message": "Something went wrong",
			"code": 500,
			"url": req.url
        });
    }
});


router.get("/videos/watch", verifyToken, async (req, res) => {
	// console.log(req.cookies);


	let accessViaToken;
	let customerId;
	const {accessToken} = req;

	if (accessToken) {
		accessViaToken = accessToken.access.includes(Number(req.query.v)) ? true : false;
		customerId = accessToken.customerId || null;
	}

	// console.log(accessToken);

	// console.log(accessToken.access.includes(req.query.v));

	try {
		// throw new Error('Som');

		const Video = await global.database.collection("videos").findOne({
			"watch": parseInt(req.query.v)
		});
	
		if (Video == null) {
			res.status(404).render("site/404", {
				"isLogin": req.session.user_id ? true : false,
				"message": "Video does not exist.",
				"url": req.url
			});
		} else {
	
			global.database.collection("videos").updateOne({
				"_id": ObjectId(Video._id)
			}, {
				$inc: {
					"views": 1
				}
			});
	
			global.database.collection("users").updateOne({
				$and: [{
					"_id": ObjectId(Video.user._id)
				}, {
					"videos._id": ObjectId(Video._id)
				}]
			}, {
				$inc: {
					"videos.$.views": 1
				}
			});
	
	
			const User = await global.database.collection("users").findOne({
				"_id": ObjectId(Video.user._id)
			});

			// console.log(req.accessToken.access.includes(req.query.v))

			// console.log(Video.price);

			const MESSAGES = req.flash('paymentResult');
	
			res.status(200).render("site/video-page", {
				"isLogin": req.session.user_id ? true : false,
				"isCustomer": customerId ? true : false,
				"messages": MESSAGES[0] ? [{ type: "payment", subject: MESSAGES[0] }] : [],
				// "messages": [{ type: "payment", subject: 'success-payment' }],
				// "messages": [{ type: "payment", subject: 'error-payment' }],
				"video": Video,
				"user": User,
				"url": req.url,
				"stripePublishableKey": _KEYS.stripePublishableKey,
				"enabled": ( Video.price === 0 || accessViaToken ) ? 1 : 0
			});
	
		}
	} catch (error) {
		// console.log(error);
		res.status(500).render("site/error-page", {
			"isCustomer": customerId ? true : false,
			"isLogin": req.session.user_id ? true : false,
			"message": "Something went wrong",
			"code": 500,
			"url": req.url
        });
	}

});


router.get('/assets/videos/:watch', verifyAccessToStream, siteController.createStream);
router.post('/charge', verifyToken, siteController.chargeClient);



module.exports = router;