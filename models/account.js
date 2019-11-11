const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')

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
	}
});

const AccountSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		minlength: 4,
		maxlength: 15,
		trim: true,
		unique: true
	},
	password: {
		type: String,
		required: true,
		minlength: 4
	},
  permissions:{
    type: String,
    required: true
  },
	plans: [CoursePlanSchema],
	banned: {
		type: Boolean,
		required: true
	}
});

AccountSchema.statics.validateLogin = function(username, password) {
	const Account = this;

	return Account.findOne({username: username}).then((account) => {
		if (!account) {
			return Promise.reject();
		}
		return new Promise((resolve, reject) => {
			bcrypt.compare(password, account.password, (error, result) => {
				if (result) {
					resolve(account);
				} else {
					reject();
				}
			})
		})
	})
}

AccountSchema.pre('save', function(next) {
	const account = this;

	if (account.isModified('password')) {
		bcrypt.hash(account.password, 10, function(err, hash){
			if (!hash){
				console.log('failed to hash');
			} else {
				account.password = hash;
				next();
			}
		});
	} else {
		next();
	}

})

const Account = mongoose.model('Account', AccountSchema);

module.exports = {Account};
