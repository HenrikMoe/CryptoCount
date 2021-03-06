const mongoose = require("mongoose");

const realizeSchema = mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    version: { // to keep track of mulitple versions of similar sets (fiat, basisPrice, address)
        type: Number,
        required: true,
    },
    unrealizedRewards: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
	unrealizedBasisRewards: {
		type: [mongoose.Schema.Types.Mixed],
		default: [],
	},
	unrealizedBasisRewardsDep: {
		type: [mongoose.Schema.Types.Mixed],
		default: [],
	},
	unrealizedBasisRewardsMVDep: {
		type: [mongoose.Schema.Types.Mixed],
		default: [],
    },
    realizedRewards: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
	realizedBasisRewards: {
		type: [mongoose.Schema.Types.Mixed],
		default: [],
	},
	realizedBasisRewardsDep: {
		type: [mongoose.Schema.Types.Mixed],
		default: [],
	},
	realizedBasisRewardsMVDep: {
		type: [mongoose.Schema.Types.Mixed],
		default: [],
	},
	fiat: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	basisDate: {
		type: Date,
		required: true,
	},
	basisPrice: {
		type: Number,
		required: false,
	},
	unrealizedBasisAgg: {
		type: Number,
		required: false,
	},
	unrealizedBasisDepAgg: {
		type: Number,
		required: false,
	},
	unrealizedBasisMVDepAgg: {
		type: Number,
		required: false,
	},
	realizedBasisAgg: {
		type: Number,
		required: false,
	},
	realizedDepAgg: {
		type: Number,
		required: false,
	},
	realizedMVdAgg: {
		type: Number,
		required: false,
	},
	unrealxtzBasis: {
		type: Number,
		required: false,
	},
	unrealBasisP: {
		type: Number,
		required: false,
	},
	unrealBasisDep: {
		type: Number,
		required: false,
	},
	unrealBasisMVdep: {
		type: Number,
		required: false,
	},
	realxtzBasis: {
		type: Number,
		required: false,
	},
	realBasisP: {
		type: Number,
		required: false,
	},
	realBasisDep: {
		type: Number,
		required: false,
	},
	realBasisMVdep: {
		type: Number,
		required: false,
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
});

// export model user with UserSchema
module.exports = mongoose.model("realize", realizeSchema);
