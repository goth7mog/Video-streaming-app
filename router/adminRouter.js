const express = require('express');
const router = express.Router();
const adminController = require(global.approute + '/controllers/adminController');
const formidable = require("formidable");
const fileSystem = require("fs");
// const fs = require('fs').promises;
// const createReadStream = require('fs').createReadStream;
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcryptjs");
const Promise_add = require("bluebird");
const ffmpeg = Promise_add.promisify(require("fluent-ffmpeg"));
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const Helper = require(global.approute + '/helpers/helpFunctions.js');
// const _KEYS = require(global.approute + '/config/keys');
// const { verifyToken } = require(global.approute + "/middleware/verifyToken");


function getUser(userId, callBack) {
	global.database.collection("users").findOne({
		"_id": ObjectId(userId)
	}, function (error, result) {
		if (error) {
			console.log(error);
			return;
		}
		if (callBack != null) {
			callBack(result);
		}
	});
}


/**
 * Admin Routes 
*/
router.get('/', adminController.index);
router.get('/register', adminController.getRegistrationPage);
router.post('/register', adminController.register);
router.get('/login', adminController.getLoginPage);
router.post('/login', adminController.login);



router.get("/logout", async (req, res) => {
	if (req.headers.referer.indexOf("/admin") > -1) {
		req.session.destroy();
		res.redirect("/admin/login");
	} else {
		req.session.destroy();
		res.redirect("/");
	}
});

router.get("/upload", function (request, result) {
	if (request.session.user_id) {
		getUser(request.session.user_id, function (user) {
			result.render("admin/upload", {
				"isLogin": true,
				"user": user,
				"url": request.url
			});
		});
	} else {
		result.redirect("/admin/login?error=Your+session+expired");
	}
});

router.get("/get_user", function (request, result) {
	if (request.session.user_id) {
		getUser(request.session.user_id, function (user) {
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User not found"
				});
			} else {
				delete user.password;

				result.json({
					"status": "success",
					"message": "Record has been fetched",
					"user": user
				});
			}
		});
	} else {
		result.status(401).json({
			"status": "error",
			"message": "Please login to perform this action."
		});
	}
});

router.post("/upload-video", async (req, res) => {
	const currentTime = new Date().getTime();

	try {

		if (req.session.user_id) {
			const User = await global.database.collection("users").findOne({
				"_id": ObjectId(req.session.user_id)
			});

			if (User == null) {
				req.session.destroy();
				return res.json({
					"status": "error",
					"message": "Can't find your credentials in the database"
				});
			}


			const formData = new formidable.IncomingForm();
			// console.log(formData);
			formData.maxFileSize = 1000 * 1024 * 1204;

			const [fields, files] = await new Promise((resolve, reject) => {
				formData.parse(req, (err, fields, files) => {
					try {
						if (err) {
							reject(err);
							return;
						}

						resolve([fields, files]);
					} catch (err) {
						reject(err);
					}
				});
			});

			const oldPath = files.video.path;
			const newPath = "assets/videos/" + currentTime + "-" + files.video.name;

			const title = fields.title;
			const price = parseFloat(fields.price) * 100 // * 100 As the price stores in cents 
			const description = fields.description;
			const tags = fields.tags;

			const oldPathThumbnail = files.thumbnail.path;
			const thumbnail = "public/admin/img/thumbnails/" + currentTime + "-" + files.thumbnail.name;

			// await fileSystem.promises.rename(oldPath, newPath);
			await fileSystem.promises.copyFile(oldPath, newPath);

			// await fileSystem.promises.rename(oldPathThumbnail, thumbnail); // .promises - for the asynchronous execution
			await fileSystem.promises.copyFile(oldPathThumbnail, thumbnail); // .promises - for the asynchronous execution

			delete User.password;

			// const duration = await getVideoDurationInSeconds(newPath);

			const duration = await new Promise((resolve, reject) => {

				ffmpeg.ffprobe(newPath, function (err, metadata) {
					if (err) {
						reject(err);
					} else {
						if (metadata) {
							resolve(metadata.format.duration);
						} else {
							reject(new Error('No video metadata retrieved'));
						}
					}
				});

			});


			const hours = Math.floor(duration / 60 / 60);
			const minutes = Math.floor(duration / 60) - (hours * 60);
			const seconds = Math.floor(duration % 60);

			// const hours = 0;
			// const minutes = 0;
			// const seconds = 0;

			const data = await global.database.collection("videos").insertOne({
				"user": {
					"_id": User._id,
					"first_name": User.first_name,
					"last_name": User.last_name,
					"image": User.image,
					"subscribers": User.subscribers
				},
				"filePath": '/' + newPath,
				"createdAt": currentTime,
				"views": 0,
				"price": price,
				"watch": currentTime,
				"minutes": minutes,
				"seconds": seconds,
				"hours": hours,
				"title": title,
				"description": description,
				"tags": tags,
				"category": fields.category,
				"thumbnail": '/' + thumbnail
			});

			await global.database.collection("users").updateOne({
				"_id": ObjectId(req.session.user_id)
			}, {
				$push: {
					"videos": {
						"_id": data.insertedId,
						"filePath": '/' + newPath,
						"createdAt": currentTime,
						"views": 0,
						"price": price,
						"watch": currentTime,
						"minutes": minutes,
						"seconds": seconds,
						"hours": hours,
						"title": title,
						"description": description,
						"tags": tags,
						"category": fields.category,
						"thumbnail": '/' + thumbnail
					}
				}
			});

			res.redirect("/admin/my_channel?message=Video+uploaded");

		} else {
			res.status(401).json({
				"status": "error",
				"message": "Please login to perform this action."
			});
		}
	} catch (err) {
		console.log(err);
		res.status(500).render("admin/500", {
			"isLogin": req.session.user_id ? true : false,
			"message": "500 - Error occured",
			"url": req.url
		});
	}
});

router.post("/save-video", function (request, result) {
	if (request.session.user_id) {
		var title = request.body.title;
		var description = request.body.description;
		var tags = request.body.tags;
		var videoId = request.body.videoId;

		global.database.collection("users").findOne({
			"_id": ObjectId(request.session.user_id),
			"videos._id": ObjectId(videoId)
		}, function (error1, video) {
			if (video == null) {
				result.send("Sorry you do not own this video");
			} else {
				global.database.collection("videos").updateOne({
					"_id": ObjectId(videoId)
				}, {
					$set: {
						"title": title,
						"description": description,
						"tags": tags,
						"category": request.body.category,
						"minutes": request.body.minutes,
						"seconds": request.body.seconds
					}
				}, function (error1, data) {

					global.database.collection("users").findOneAndUpdate({
						$and: [{
							"_id": ObjectId(request.session.user_id)
						}, {
							"videos._id": ObjectId(videoId)
						}]
					}, {
						$set: {
							"videos.$.title": title,
							"videos.$.description": description,
							"videos.$.tags": tags,
							"videos.$.category": request.body.category,
							"videos.$.minutes": request.body.minutes,
							"videos.$.seconds": request.body.seconds
						}
					}, function (error2, data1) {
						result.json({
							"status": "success",
							"message": "Video has been published"
						});
					});
				});
			}
		});
	} else {
		result.status(401).json({
			"status": "danger",
			"message": "Please login to perform this action."
		});
	}
});

router.post("/edit", async (req, res) => {
	if (req.session.user_id) {
		const formData = new formidable.IncomingForm();
		const [fields, files] = await new Promise((resolve, reject) => {
			formData.parse(req, (err, fields, files) => {
				if (err) {
					reject(err);
					return;
				}
				resolve([fields, files]);
			});
		});

		if (fields.price === "" || fields.title === "") {
			return res.redirect(`/admin/edit?v=${req.query.v}&error=Error.+Fields+'title'+and+'price'+can't+be+left+empty`);
		}


		const title = fields.title;
		const description = fields.description;
		const tags = fields.tags;
		const videoId = fields.videoId;
		const price = parseFloat(fields.price) * 100 // * 100 As the price stores in cents 
		let thumbnail = fields.thumbnailPath;



		const User = await global.database.collection("users").findOne({
			"_id": ObjectId(req.session.user_id),
			"videos._id": ObjectId(videoId)
		});

		if (User == null) {
			// return res.json({
			// 	"message": "Sorry you do not own this video"
			// });
			return res.status(403).render("admin/404", {
				"isLogin": true,
				"message": "Sorry, you do not own this video.",
				"url": req.url
			});
		}

		if (files.thumbnail.size > 0) {

			if (typeof fields.thumbnailPath !== "undefined" && fields.thumbnailPath != "" && await Helper.fileExists(fields.thumbnailPath.slice(1))) {
				await fileSystem.promises.unlink(fields.thumbnailPath.slice(1));
			}

			const oldPath = files.thumbnail.path;
			const newPath = "public/admin/img/thumbnails/" + new Date().getTime() + "-" + files.thumbnail.name;
			thumbnail = '/' + newPath;

			// await fileSystem.promises.rename(oldPath, newPath);
			await fileSystem.promises.copyFile(oldPath, newPath);
		}

		const updatedVideo = await global.database.collection("videos").findOneAndUpdate({
			"_id": ObjectId(videoId)
		}, {
			$set: {
				"title": title,
				"description": description,
				"tags": tags,
				"category": fields.category,
				"thumbnail": thumbnail,
				"price": price
			}
		},
			{
				// returnNewDocument: true,
				returnDocument: "after",
			});

		const updatedUser = await global.database.collection("users").findOneAndUpdate({
			$and: [{
				"_id": ObjectId(req.session.user_id)
			}, {
				"videos._id": ObjectId(videoId)
			}]
		}, {
			$set: {
				"videos.$.title": title,
				"videos.$.description": description,
				"videos.$.tags": tags,
				"videos.$.category": fields.category,
				"videos.$.thumbnail": thumbnail,
				"videos.$.price": price
			}
		},
			{
				returnDocument: "after",
				// returnNewDocument: true
			});


		res.status(200).render("admin/edit-video", {
			"isLogin": true,
			"video": updatedVideo.value,
			"user": updatedUser.value,
			"url": req.url,
			"message": "Video has been updated"
		});

		// res.redirect("/my_channel?message=Video has been updated");

	} else {
		res.redirect("/admin/login?error=Your+session+expired");
	}
});

router.get("/watch", async (req, res) => {
	// console.log(req.cookies);

	try {
		// throw new Error('Some');
		if (req.session.user_id) {

			const Video = await global.database.collection("videos").findOne({
				"watch": parseInt(req.query.v)
			});

			if (Video == null) {
				res.status(404).render("admin/404", {
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


				// console.log(Video.price);

				// const MESSAGES = req.flash('paymentResult');

				res.status(200).render("admin/video-page", {
					"isLogin": req.session.user_id ? true : false,
					// "isCustomer": customerId ? true : false,
					// "messages": MESSAGES[0] ? [{ type: "payment", subject: MESSAGES[0] }] : [],
					// "messages": [{ type: "payment", subject: 'success-payment' }],
					// "messages": [{ type: "payment", subject: 'error-payment' }],
					"video": Video,
					"user": User,
					"url": req.url,
					// "stripePublishableKey": _KEYS.stripePublishableKey,
					// "enabled": ( Video.price === 0 || req.session.user_id || accessViaToken ) ? 1 : 0
				});

			}
		} else {
			res.redirect("/admin/login?error=Your+session+expired");
		}

	} catch (error) {
		// console.log(error);
		res.status(500).render("admin/500", {
			"isLogin": req.session.user_id ? true : false,
			// "isCustomer": customerId ? true : false,
			"message": "500 - Error occured",
			"url": req.url
		});
	}

});


router.get("/channel", function (request, result) {
	if (request.session.user_id) {

		global.database.collection("users").findOne({
			"_id": ObjectId(request.query.c)
		}, function (error1, user) {
			if (user == null) {
				result.render("admin/404", {
					"isLogin": request.session.user_id ? true : false,
					"message": "Channel not found",
					"url": request.url
				});
			} else {
				result.render("admin/single-channel", {
					"isLogin": request.session.user_id ? true : false,
					"user": user,
					"headerClass": "single-channel-page",
					"footerClass": "ml-0",
					"isMyChannel": request.session.user_id == request.query.c,
					"error": request.query.error ? request.query.error : "",
					"url": request.url,
					"message": request.query.message ? request.query.message : "",
					"error": ""
				});
			}
		});

	} else {
		result.redirect("/admin/login?error=Your+session+expired");
	}
});

router.get("/my_channel", function (request, result) {
	if (request.session.user_id) {
		global.database.collection("users").findOne({
			"_id": ObjectId(request.session.user_id)
		}, function (error1, user) {
			result.render("admin/single-channel", {
				"isLogin": true,
				"user": user,
				"headerClass": "single-channel-page",
				"footerClass": "ml-0",
				"isMyChannel": true,
				"message": request.query.message ? request.query.message : "",
				"error": request.query.error ? request.query.error : "",
				"url": request.url
			});
		});
	} else {
		result.redirect("/admin/login?error=Your+session+expired");
	}
});

router.get("/edit", function (request, result) {
	if (request.session.user_id) {
		global.database.collection("videos").findOne({
			"watch": parseInt(request.query.v)
		}, function (error1, video) {
			if (video == null) {
				result.render("admin/404", {
					"isLogin": true,
					"message": "This video does not exist.",
					"url": request.url
				});
			} else {
				if (video.user._id != request.session.user_id) {
					result.send("Sorry you do not own this video.");
				} else {
					getUser(request.session.user_id, function (user) {
						result.render("admin/edit-video", {
							"isLogin": true,
							"video": video,
							"user": user,
							"url": request.url,
							"error": request.query.error ? request.query.error : "",
						});
					});
				}
			}
		});
	} else {
		result.redirect("/admin/login?error=Your+session+expired");
	}
});

// router.post("/do-like", function (request, result) {
// 	result.json({
// 		"status": "success",
// 		"message": "Like/dislike feature is in premium version. Kindly read README.txt to get full version."
// 	});
// });

// router.post("/do-dislike", function (request, result) {
// 	result.json({
// 		"status": "success",
// 		"message": "Like/dislike is in premium version. Kindly read README.txt to get full version."
// 	});
// });

router.post("/do-comment", function (request, result) {
	if (request.session.user_id) {
		var comment = request.body.comment;
		var videoId = request.body.videoId;

		getUser(request.session.user_id, function (user) {
			delete user.password;

			global.database.collection("videos").findOneAndUpdate({
				"_id": ObjectId(videoId)
			}, {
				$push: {
					"comments": {
						"_id": ObjectId(),
						"user": {
							"_id": user._id,
							"first_name": user.first_name,
							"last_name": user.last_name,
							"image": user.image
						},
						"comment": comment,
						"createdAt": new Date().getTime()
					}
				}
			}, function (error1, data) {
				result.json({
					"status": "success",
					"message": "Comment has been posted",
					"user": {
						"_id": user._id,
						"first_name": user.first_name,
						"last_name": user.last_name,
						"image": user.image
					},
					"comment": comment
				});
			});
		});
	} else {
		result.status(401).json({
			"status": "danger",
			"message": "Please login to perform this action."
		});
	}
});

router.post("/do-reply", function (request, result) {
	if (request.session.user_id) {
		var reply = request.body.reply;
		var commentId = request.body.commentId;

		getUser(request.session.user_id, function (user) {
			delete user.password;

			var replyObject = {
				"_id": ObjectId(),
				"user": {
					"_id": user._id,
					"first_name": user.first_name,
					"last_name": user.last_name,
					"image": user.image
				},
				"reply": reply,
				"createdAt": new Date().getTime()
			};

			global.database.collection("videos").findOneAndUpdate({
				"comments._id": ObjectId(commentId)
			}, {
				$push: {
					"comments.$.replies": replyObject
				}
			}, function (error1, data) {
				result.json({
					"status": "success",
					"message": "Reply has been posted",
					"user": {
						"_id": user._id,
						"first_name": user.first_name,
						"last_name": user.last_name,
						"image": user.image
					},
					"reply": reply
				});
			});
		});
	} else {
		result.status(401).json({
			"status": "danger",
			"message": "Please login to perform this action."
		});
	}
});

router.get("/get-related-videos", function (request, result) {
	global.database.collection("videos").find({
		$and: [{
			"category": request.query.category
		}, {
			"_id": {
				$ne: ObjectId(request.query.videoId)
			}
		}]
	}).toArray(function (error1, videos) {
		result.json(videos);
	});
});

router.get("/get-all-videos", async (request, result) => {
	const videos = await database.collection("videos").find({}).sort({ "createdAt": -1 }).toArray();
	result.json(videos);
});

router.get("/search", function (request, result) {

	global.database.collection("videos").find({
		"title": {
			$regex: request.query.search_query,
			$options: "i"
		}
	}).toArray(function (error1, videos) {
		result.render("admin/search-query", {
			"isLogin": request.session.user_id ? true : false,
			"videos": videos,
			"query": request.query.search_query,
			"url": request.url
		});
	});
});

router.get("/my_settings", function (request, result) {
	if (request.session.user_id) {
		getUser(request.session.user_id, function (user) {
			result.render("admin/settings", {
				"isLogin": true,
				"user": user,
				"message": request.query.message ? "Settings has been saved" : "",
				"error": request.query.error ? "Please fill all fields" : "",
				"url": request.url
			});
		});
	} else {
		result.redirect("/admin/login?error=Your+session+expired");
	}
});

router.post("/save_settings", function (request, result) {
	if (request.session.user_id) {
		var password = request.body.password;

		if (request.body.first_name == "" || request.body.last_name == "") {
			result.redirect("/admin/my_settings?error=1");
			return;
		}

		if (password == "") {
			global.database.collection("users").updateOne({
				"_id": ObjectId(request.session.user_id)
			}, {
				$set: {
					"first_name": request.body.first_name,
					"last_name": request.body.last_name
				}
			});
		} else {
			bcrypt.genSalt(10, function (err, salt) {
				bcrypt.hash(password, salt, async function (err, hash) {
					global.database.collection("users").updateOne({
						"_id": ObjectId(request.session.user_id)
					}, {
						$set: {
							"first_name": request.body.first_name,
							"last_name": request.body.last_name,
							"password": hash
						}
					})
				})
			})
		}

		global.database.collection("users").updateOne({
			"subscriptions.channelId": ObjectId(request.session.user_id)
		}, {
			$set: {
				"subscriptions.$.channelName": request.body.first_name + " " + request.body.last_name
			}
		});

		global.database.collection("users").updateOne({
			"subscriptions.subscribers.userId": ObjectId(request.session.user_id)
		}, {
			$set: {
				"subscriptions.subscribers.$.channelName": request.body.first_name + " " + request.body.last_name
			}
		});

		global.database.collection("users").updateOne({
			"subscribers.userId": ObjectId(request.session.user_id)
		}, {
			$set: {
				"subscribers.$.channelName": request.body.first_name + " " + request.body.last_name
			}
		});

		global.database.collection("videos").updateOne({
			"user._id": ObjectId(request.session.user_id)
		}, {
			$set: {
				"user.first_name": request.body.first_name,
				"user.last_name": request.body.last_name
			}
		});

		result.redirect("/admin/my_settings?message=1");
	} else {
		result.redirect("/admin/login?error=Your+session+expired");
	}
});

router.post("/update-social-media-link", function (req, res) {
	if (req.session.user_id) {
		res.json({
			"status": "success",
			"message": "Video has been liked"
		});
	} else {
		res.redirect("/admin/login?error=Your+session+expired");
	}
});


router.post("/delete-video", async (req, res) => {
	const watchId = req.body.watchId || null;
	// return res.status(500).json({ message: "Internal Server Error. Something went wrong" });
	// return res.status(401).json({ message: "Error. watchId is not provided" });
	// return res.status(401).json({ message: "Error. You don't own this video" });
	// return res.status(403).json({ message: "Please login" });
	// return res.status(200).json({ status: "Success", message: "Video Deleted" });

	try {

		// const promise = new Promise((resolve, reject) => {
		// 	setTimeout(() => resolve("done!"), 5000)
		//   });

		// const result = await promise; // wait until the promise resolves (*)

		// return res.status(200).json({ status: "Success", message: "Video Deleted" });


		if (req.session.user_id) {
			if (watchId === null) {
				return res.status(400).json({ message: "Error. watchId is not provided" });
			}

			const Video = await global.database.collection("videos").findOne({
				$and: [{
					"user._id": ObjectId(req.session.user_id)
				}, {
					"watch": parseInt(watchId)
				}]
			});

			if (Video == null) {
				return res.status(403).json({ message: "Error. You don't own this video" });
			}

			console.log(await Helper.fileExists(Video.filePath));

			if (await Helper.fileExists(Video.filePath.slice(1))) {
				await fileSystem.promises.unlink(Video.filePath.slice(1));
			}

			if (await Helper.fileExists(Video.thumbnail.slice(1))) {
				await fileSystem.promises.unlink(Video.thumbnail.slice(1));
			}

			await global.database.collection("videos").remove({
				$and: [{
					"_id": ObjectId(Video._id)
				}, {
					"user._id": ObjectId(req.session.user_id)
				}]
			});

			await global.database.collection("users").findOneAndUpdate({
				"_id": ObjectId(req.session.user_id)
			}, {
				$pull: {
					"videos": {
						"_id": ObjectId(Video._id)
					}
				}
			});

			await global.database.collection("customers").updateMany({}, {
				$pull: {
					"access": Video.watch
				}
			});


			res.status(200).json({ status: "Success", message: "Video Deleted" });

		} else {
			res.status(401).json({ message: "Please login" });
		}

	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Internal Server Error" });
	}

});

//-------------------------------------- The End of Routers -------------------------------------------//



module.exports = router;