const mongoose = require('mongoose');

const CoursePlanSchema = new mongoose.Schema({
	madeby: {
		type: String,
		required: true
	},
	main: {
		type: Boolean,
		required: true
	},
	name: {
		type: String,
		minlength: 1,
		required: true
	},
	major: {
		type: String,
		minlength: 1,
		required: true
	},
	graph: {
		type: Object
	},
	public: {
		type: Boolean,
		required: true
	},
	reviews: []
});

const PublicPlan = mongoose.model('PublicPlan', CoursePlanSchema);

module.exports = {PublicPlan};
