var Express = require("express");
var Tags = require("../Validator.js").Tags;
var router = Express.Router({ caseSensitive: true });
var async = require("async");
var { Session } = require("../Session.js");
let axios = require("axios");
const {
	analysis,
	realizeRew,
	saveRealize,
	autoAnalysis,
} = require("./tzdelpre.js");

router.baseURL = "/Anal";

const RealizeHistObj = require("../../model/realize.js");
const BlockchainModel = require("../../model/blockchain.js");
const User = require("../../model/User.js");

// given obj id - get obj (BETA)
router.get("/:objId", function (req, res) {
	objId = req.params.objId;
	console.log(objId);
	async.waterfall(
		[
			function (cb) {
				RealizeHistObj.findOne({ _id: objId }, function (err, doc) {
					if (err) cb(err);
					cb(null, doc);
				});
			},
			function (set, cb) {
				res.status(200).json(set);
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

// for history page - get all users objs (BETA)
router.get("/", function (req, res) {
	user_id = req.session.prsId;
	async.waterfall(
		[
			function (cb) {
				RealizeHistObj.find({ userid: user_id }, function (err, doc) {
					if (err) cb(err);
					cb(null, doc);
				});
			},
			function (sets, cb) {
				res.status(200).json(sets);
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

// beta auto basis price calculation
router.post("/Auto", function (req, res) {
	var vld = req.validator;
	var body = req.body;
	var unrel_obj = {};
	const { address, fiat } = body;
	console.log(address);
	console.log(fiat);
	async.waterfall(
		[
			async function (cb) {
				if (vld.hasFields(body, ["address", "fiat", "histObjId"]))
					try {
						unrel_obj = await autoAnalysis(address, fiat);
						console.log(unrel_obj);
						return unrel_obj;
					} catch (error) {
						console.log("analysis error");
						console.log(error);
						return error;
					}
			},
			function (unrel_obj, cb) {
				// here we check to see if our previous function returned a
				// error in the catch block and we instantly jump to the callback
				// by passing the error in
				if (unrel_obj && unrel_obj.stack && unrel_obj.message) {
					cb(unrel_obj, null);
				}
				console.log(body["histObjId"]);
				RealizeHistObj.findOneAndUpdate(
					{ _id: body["histObjId"] },
					{
						$set: {
							unrealizedRewards: unrel_obj.unrealizedRewards,
							unrealizedBasisRewards:
								unrel_obj.unrealizedBasisRewards,
							unrealizedBasisRewardsDep:
								unrel_obj.unrealizedBasisRewardsDep,
							unrealizedBasisRewardsMVDep:
								unrel_obj.unrealizedBasisRewardsMVDep,
							basisPrice: unrel_obj.basisPrice,
						},
					},
					{ new: true },
					function (err, doc) {
						if (err) cb(err);
						cb(null, doc);
					}
				);
			},
			function (result, cb) {
				//after creating new rel db obj,
				// add the send unrel to FE
				// console.log(result)
				// console.log('results')
				console.log(result);
				res.status(200).json(result);
				cb();
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

// beta save realize function (needs proper route handling)
router.post("/Save", function (req, res) {
	var body = req.body;
	var ssn = req.session;
	console.log("SESSION REALIZING");
	console.log(ssn.realizing);
	async.waterfall(
		[
			async function (cb) {
				try {
					// make sure to clear session realizing set
					// probably should add check to make sure realizing object equals
					// the session realizing object
					rel_obj = await saveRealize(ssn.realizing);
					return rel_obj;
				} catch (error) {
					return error;
				}
			},
			function (rel_obj, cb) {
				if (rel_obj && rel_obj.stack && rel_obj.message) {
					cb(rel_obj, null);
				}
				console.log("rel_obj");
				console.log(rel_obj);
				res.status(200).json(rel_obj);
				cb();
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

// beta realize function (needs proper route handling)
// add check to make sure setId belongs to prsId
router.post("/Realize", function (req, res) {
	var body = req.body;
	var ssn = req.session;
	async.waterfall(
		[
			async function (cb) {
				try {
					rel_obj = await realizeRew(
						body["realizedQuantity"],
						body["setId"]
					);

					return rel_obj;
				} catch (error) {
					return error;
				}
			},
			function (rel_obj, cb) {
				if (rel_obj && rel_obj.stack && rel_obj.message) {
					cb(rel_obj, null);
				}
				ssn.realizing = {
					// save information on a session level
					realizingRewards: rel_obj["realizingRewards"],
					realizingBasisRewards: rel_obj["realizingRewardBasis"],
					realizingBasisRewardsDep:
						rel_obj["realizingRewardBasisDep"],
					realizingBasisRewardsMVDep:
						rel_obj["realizingRewardBasisMVDep"],
					realizingRewardAgg: rel_obj["realizingRewardAgg"],
					realizingBasisAgg: rel_obj["realizingBasisAgg"],
					realizingDepAgg: rel_obj["realizingDepAgg"],
					realizingMVDepAgg: rel_obj["realizingMVdAgg"],
					realizingXTZBasis: rel_obj["realizingXTZbasis"],
					realizingBasisP: rel_obj["realizingBasisP"],
					realizingBasisDep: rel_obj["realizingBasisDep"],
					realizingBasisMVDep: rel_obj["realizingBasisMVdep"],
				};
				console.log("rel_obj");
				console.log(rel_obj);
				res.status(200).json(rel_obj);
				cb();
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

router.post("/Unrel", function (req, res) {
	var vld = req.validator;
	var body = req.body;
	var unrel_obj = {};
	const { address, fiat, basisDate } = body;
	console.log(address);
	console.log(fiat);
	console.log(basisDate);
	async.waterfall(
		[
			async function (cb) {
				if (
					vld.hasFields(body, [
						"address",
						"fiat",
						"basisDate",
						"histObjId",
					])
				)
					try {
						unrel_obj = await analysis(address, basisDate, fiat);
						console.log(unrel_obj);
						return unrel_obj;
					} catch (error) {
						console.log("analysis error");
						console.log(error);
						return error;
					}
			},
			function (unrel_obj, cb) {
				// here we check to see if our previous function returned a
				// error in the catch block and we instantly jump to the callback
				// by passing the error in
				if (unrel_obj && unrel_obj.stack && unrel_obj.message) {
					cb(unrel_obj, null);
				}
				console.log(body["histObjId"]);
				RealizeHistObj.findOneAndUpdate(
					{ _id: body["histObjId"] },
					{
						$set: {
							unrealizedRewards: unrel_obj.unrealizedRewards,
							unrealizedBasisRewards:
								unrel_obj.unrealizedBasisRewards,
							unrealizedBasisRewardsDep:
								unrel_obj.unrealizedBasisRewardsDep,
							unrealizedBasisRewardsMVDep:
								unrel_obj.unrealizedBasisRewardsMVDep,
							unrealxtzBasis: unrel_obj.xtzBasis,
							unrealBasisP: unrel_obj.basisP,
							unrealBasisDep: unrel_obj.basisDep,
							unrealBasisMVDep: unrel_obj.basisMVDep,
							//basis data
							basisPrice: unrel_obj.basisPrice,
						},
					},
					{ new: true },
					function (err, doc) {
						if (err) cb(err);
						cb(null, doc);
					}
				);
			},
			function (result, cb) {
				//after creating new rel db obj,
				// add the send unrel to FE
				// console.log(result)
				// console.log('results')
				console.log(result);
				res.status(200).json(result);
				cb();
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

router.post("/Cal", function (req, res) {
	var vld = req.validator;
	var body = req.body;

	async.waterfall(
		[
			async function (cb) {
				if (vld.hasFields(body, ["address", "fiat"]))
					prices = await getPrices(body["fiat"]);
				cal_vals = await getBalances(body["address"], prices);
				res.status(200).json({ cal_vals });
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

router.post("/", function (req, res) {
	var vld = req.validator;
	var body = req.body;
	var prsId = req.session.prsId;

	async.waterfall(
		[
			function (cb) {
				// given
				if (vld.hasFields(body, ["address", "fiat", "basisDate"]))
					RealizeHistObj.find(
						{
							fiat: body["fiat"],
							address: body["address"],
							basisDate: body["basisDate"],
							userid: prsId,
						},
						function (err, docs) {
							if (err) cb(err);
							cb(null, docs);
						}
					);
			},
			function (setCheck, cb) {
				// if a dup exists send a body with 'dup check' to indicate to the
				// front end that they should prompt the user with a dialogue to manage
				// duplicates
				if (setCheck.length !== 0) {
					res.status(200).json({
						"dup check": setCheck.length,
						"dup of": setCheck[0]._id,
					});
					cb(null, null);
				}
				// if no dups exist, create a new realize history object
				else {
					rel_obj = new RealizeHistObj({
						userid: prsId,
						version: 0,
						fiat: body["fiat"],
						address: body["address"],
						basisDate: body["basisDate"],
					});
					rel_obj.save(function (err, doc) {
						if (err) cb(err);
						cb(null, doc);
					});
				}
			},
			function (rel_doc, cb) {
				// associate the new realize history obj with the user
				if (rel_doc) {
					User.findOneAndUpdate(
						{ _id: prsId },
						{ $addToSet: { setIds: rel_doc._id } },
						function (err, doc) {
							if (err) cb(err);
							cb(null, rel_doc._id);
						}
					);
				}
			},
			function (doc, cb) {
				res.json({ setId: doc });
				cb();
			},
		],
		function (err) {
			if (err) console.log(err);
		}
	);
});

Date.prototype.addDays = function (days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};

async function getBalances(address, price) {
	let balances = {};
	//offset from index
	let offset = 0;
	let resp_lens = 10000;
	while (resp_lens === 10000) {
		let url = `https://api.tzkt.io/v1/accounts/${address}/balance_history?offset=${offset}&limit=10000`;
		const response = await axios.get(url);
		resp_lens = response.data.length;
		offset += response.data.length; // update lastId, length of offset is all so it gets the length, then stops again while true because it fills the return of the query
		// api returns only changes
		// for each date, check date ahead and fill all dates upto that date
		for (let i = 0; i < response.data.length - 1; i++) {
			const element = response.data[i];
			//make this into normal date
			var d1 = element.timestamp.substring(0, 10);
			var d2 = response.data[i + 1].timestamp.substring(0, 10);

			if (d1 === d2) {
				balances[d1] = element.balance;
			} else {
				d1 = new Date(d1);
				d2 = new Date(d2);
				date_itr = d1;
				while (date_itr < d2) {
					date_key = date_itr.toISOString().slice(0, 10);
					balances[date_key] = {
						balance: response.data[i].balance,
						price: price[date_key],
					};
					date_itr = date_itr.addDays(1);
				}
			}
		}
	}
	return balances;
}

async function getPrices(fiat) {
	let price = `price${fiat}`;
	let marketCap = `marketCap${fiat}`;
	// console.log(price, marketCap)
	let priceAndMarketCapData = await BlockchainModel.find();
	let finalData = {};
	for (i = 0; i < priceAndMarketCapData.length; i++) {
		let date = priceAndMarketCapData[i].date;
		//why cant identifier at end be var?
		let priceN = priceAndMarketCapData[i][price];
		let marketCapN = priceAndMarketCapData[i][marketCap];
		date_iso_str = date.toISOString().slice(0, 10);
		finalData[date_iso_str] = priceN;
	}
	return finalData;
}

module.exports = router;
